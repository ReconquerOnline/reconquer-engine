import { definitions, getAnimationName, segmentToPVPMultiplier, materialToLevelMap, setAnimation } from "../loader.js";
import { getDynamicCollisionChange, getFirstAmmoTypeFromInventory, moveTowardsTargetWithNonBlockingRotation, rotateTowardsTargetNonBlocking } from "../action_utils.js";
import { getBehavior } from "../behaviors.js";
import * as WorldState from '../world_state.js';
import { distanceBetween, perpendicularDistanceBetween, removeAmountFromSlot } from "../utils.js";
import { checkAttackLineOfSite, checkCollisionLineOfSite } from "./move_action.js";
import DefeatHooks, { TargetDefeatHooks } from "../defeat_hooks.js";
import { gainXp, getBaseLevel, getLevel, loseXp } from "../skills.js";
import AttackActionOverrides from './attack_action_overrides/attack_action_overrides.js';
import { isPrayerEnabled } from "../fidelity.js";
import { publish } from "../signals.js";

var animationToDefenseMap = {
    "slash": "esld",
    "crush": "ecrd",
    "stab": "estd",
    "2h_slash": "esld",
    "2h_crush": "ecrd",
    "2h_stab": "estd",
    "bow": "eard",
    "longbow": "eard",
    "crossbow": "eard",
}

var animationToDistributionMap = {
    "2h_slash": "high_variance",
    "2h_crush": "high_variance",
    "2h_stab": "high_variance",
    "longbow": "high_variance",
}

export default class AttackAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;

        this.currentTick = 0;
        this.attackOverride = null;

    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    static getFirstAmmoSlot(user, userPriv) {
        var animationName = getAnimationName(user, user.sa);
        if (animationName == 'crossbow') {
            return getFirstAmmoTypeFromInventory(userPriv, 'bolt');
        } else if (animationName.endsWith('bow')) {
            return getFirstAmmoTypeFromInventory(userPriv, 'arrow');
        } 
        return true;
    }
    static gainCombatXp(experience, arrow, key, worldState, maxLevelForXp) {
        var userPriv = worldState.priv[key];
        if (userPriv.iw) {
            if (userPriv.ish) {
                gainXp('accuracy', experience, key, worldState, maxLevelForXp);
                gainXp('strength', experience, key, worldState, maxLevelForXp);
                gainXp('defense', experience, key, worldState, maxLevelForXp);
            } else if (definitions[userPriv.iw].wearBehavior.twoHand) {
                if (arrow) {
                    gainXp('archery', 3 * experience, key, worldState, maxLevelForXp);
                } else {
                    gainXp('strength', 3 * experience, key, worldState, maxLevelForXp);
                }
            } else {
                gainXp('accuracy', 3 * experience, key, worldState, maxLevelForXp);
            }
        } else {
            if (userPriv.ish) {
                gainXp('defense', 3 * experience, key, worldState, maxLevelForXp);
            } else {
                gainXp('accuracy', experience, key, worldState, maxLevelForXp);
                gainXp('strength', experience, key, worldState, maxLevelForXp);
                gainXp('defense', experience, key, worldState, maxLevelForXp);
            }
        }
        gainXp('health', experience, key, worldState, maxLevelForXp + 10);
    }
    static calculateHit(userId, targetId, arrow, worldState) {
        var accuracyBonus = worldState.priv[userId].eacc ? worldState.priv[userId].eacc : 0;
        var strengthBonus = worldState.priv[userId].estr ? worldState.priv[userId].estr : 0;
        var defenseBonus = worldState.priv[targetId].edef ? worldState.priv[targetId].edef : 0;

        var animation = getAnimationName(worldState.pub[userId], worldState.pub[userId].sa);
        if (animationToDefenseMap[animation]) {
            var extraDefense = worldState.priv[targetId][animationToDefenseMap[animation]];
            if (extraDefense) defenseBonus += extraDefense;
        }

        var accuracyLevel = arrow ? getLevel('archery', userId, worldState) : getLevel('accuracy', userId, worldState);
        var strengthLevel = arrow ? accuracyLevel : getLevel('strength', userId, worldState);
        var defenseLevel = getLevel('defense', targetId, worldState);

        if (arrow) {
            var arrowMaterial = arrow.split('_')[0];
            var arrowLevel = materialToLevelMap[arrowMaterial] ? materialToLevelMap[arrowMaterial] : 0;
            accuracyBonus += arrowLevel;
            strengthBonus += arrowLevel;
        }

        // if you are a player, then adjust bonuses
        if (WorldState.isLoggedIn(userId)) {
            // adjust bonuses based on level
            
            accuracyBonus = (((accuracyBonus / (18/5) - accuracyLevel - 5) + 20) / 2) * 10;
            strengthBonus = (((strengthBonus / (18/5) - strengthLevel - 5) + 20) / 2) * 10;
            
            if (accuracyBonus < 0) {
                accuracyBonus *= 2;
            }
            if (strengthBonus < 0) {
                strengthBonus *= 2;
            }

        } else if (WorldState.isLoggedIn(targetId)) {
            defenseBonus = (((defenseBonus / (18/5) - defenseLevel - 5) + 20) / 2) * 10;
            if (defenseBonus < 0) {
                defenseBonus *= 2;
            }
        }

        var hit = 0;
        var totalStrengthBonus = (strengthLevel + strengthBonus / 10)
        var maxHit = Math.max(Math.floor(totalStrengthBonus / 4), 1); // take into account strength/archery level

        var totalAttackerBonus = accuracyLevel + accuracyBonus / 10;
        var totalDefenderBonus = defenseLevel + defenseBonus / 10;

        if (isPrayerEnabled(targetId, worldState, 'defendMe')) {
            totalDefenderBonus += 5
        }
        if (isPrayerEnabled(userId, worldState, 'focusMe')) {
            totalAttackerBonus += 5;
        }
        if (isPrayerEnabled(userId, worldState, 'strengthenMe')) {
            maxHit += 1;
        }

        var attackerRoll = Math.floor(Math.random() * 100 + totalAttackerBonus); // take into account accuracy/archery level
        var defenderRoll = Math.floor(Math.random() * 100 + totalDefenderBonus); // take into account target defense level
        if (attackerRoll > defenderRoll) {
            if (animationToDistributionMap[animation] == 'high_variance') {
                hit = Math.random() > .5 ? Math.ceil(maxHit) : 0;
            } else {
                hit = Math.round(Math.random() * maxHit);
            }

        }

        if (arrow &&
            definitions[arrow] &&
            definitions[arrow].ammoParameters &&
            definitions[arrow].ammoParameters.class) {
            var arrowClass = definitions[arrow].ammoParameters.class;
            if (
                (arrowClass == 'wind' && isPrayerEnabled(targetId, worldState, 'protectFromWind')) || 
                (arrowClass == 'water' && isPrayerEnabled(targetId, worldState, 'protectFromWater')) ||
                (arrowClass == 'fire' && isPrayerEnabled(targetId, worldState, 'protectFromFire'))
            ) {
                return 0;
            }
        }

        // Adjust hit for PVP area
        if (worldState.serv[userId] && worldState.serv[targetId]) {
            var multiplier = segmentToPVPMultiplier[
                worldState.pub[targetId].lsx +
                '-' +
                worldState.pub[targetId].lsy
            ]
            if (!multiplier) {
                multiplier = 0;
            }
            // if target is public enemy, multiplier becomes 1
            if (worldState.pub[targetId].en) {
                multiplier = 1;
            }
            var newHit = hit * multiplier;
            if (Math.random() < newHit - Math.floor(newHit)) {
                newHit += 1;
            }
            hit = Math.floor(newHit);
        }
        
        return hit;
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target || user.lf != target.lf || !target.hp || target.hp <= 0 || user.i == target.i || user.li != target.li) {
            setAnimation(user, 'idle')
            return false;
        }

        var oldAnimation = user.sa;

        var weapon = userPriv.iw;
        var weaponDefinition = definitions[weapon] ? definitions[weapon] : {};
        var attackParameters = weaponDefinition.attackParameters ? weaponDefinition.attackParameters : {};
        if (!this.attackOverride && AttackActionOverrides[user.t]) {
            this.attackOverride = new AttackActionOverrides[user.t]();
        }

        var distance = distanceBetween(user, target) - getDynamicCollisionChange(user) - getDynamicCollisionChange(target);

        if (distance > 32) {
            setAnimation(user, 'idle');
            return false;
        }
        if (distance == 0 && user.t == 'character') {
            setAnimation(user, 'idle');
            return true;
        }

        var persist;
        var attackDistance = attackParameters.distance ? attackParameters.distance : 2;
        var initialDistance = distanceBetween(user, target) - getDynamicCollisionChange(user) - getDynamicCollisionChange(target);
        if (attackDistance == 2 || initialDistance > attackDistance) {
            persist = moveTowardsTargetWithNonBlockingRotation(user, target, key, worldState);
        }
        if (getDynamicCollisionChange(user) >= 0.5 || initialDistance <= attackDistance) {
            rotateTowardsTargetNonBlocking(user, target, key, worldState);
        }

        if (this.attackOverride && this.attackOverride.handleTick) {
            this.attackOverride.handleTick(worldState);
        }

        if (persist !== undefined && distance > attackDistance) {
            return persist;
        };

        // make sure there is a line of sight
        if (!checkAttackLineOfSite(user, target) || (attackDistance == 2 && perpendicularDistanceBetween(user, target) == 2 && !checkCollisionLineOfSite(user, target)) ) {
            setAnimation(user, 'idle');
            return false;
        }

        var animation = attackParameters.animation ? attackParameters.animation : 'slash';
        if (this.attackOverride && this.attackOverride.getAnimation) {
            animation = this.attackOverride.getAnimation(target, user, worldState, this.currentTick);
        }
        var ticksInAnimation = setAnimation(user, animation) || setAnimation(user, 'slash') || setAnimation(user, 'attack');
        if (oldAnimation != user.sa) {
            this.currentTick = 0;
        }

        // if using bow or crossbow, make sure ammo is available
        var firstAmmoSlot = AttackAction.getFirstAmmoSlot(user, userPriv);
        if (!firstAmmoSlot && !this.arrow) {
            setAnimation(user, 'idle');
            return false;
        }
        this.currentTick += 1;
        if (typeof firstAmmoSlot == 'string' && this.currentTick == ticksInAnimation - 1) {
            // show ammo animation
            this.arrow = userPriv[firstAmmoSlot][0];
            user.at = target.i + ',' + this.arrow;
            removeAmountFromSlot(firstAmmoSlot, 1, userPriv);
        } else if (this.currentTick == ticksInAnimation) {
            user.at = '';
            var hit = AttackAction.calculateHit(user.i, target.i, this.arrow, worldState);
            if (this.attackOverride && this.attackOverride.handleAttack) {
                var result = this.attackOverride.handleAttack(worldState);
                if (typeof result == 'number') {
                    hit = result;
                }
            }
            target.hp -= hit;
            target.hp = Math.max(target.hp, 0);
            if (target.hp <= 0) {
                // disable experience for PVP
                if (!WorldState.isLoggedIn(target.i)) {
                    var experience = Math.floor(target.mhp / 3);
                    AttackAction.gainCombatXp(experience, this.arrow, key, worldState, definitions[target.t].maxLevelForXp);
                } else if(WorldState.isLoggedIn(key)) {
                    var lossAmount = worldState.serv[key].fidelityLoss;
                    var multiplier = segmentToPVPMultiplier[
                        worldState.pub[key].lsx +
                        '-' +
                        worldState.pub[key].lsy
                    ] 
                    lossAmount = lossAmount * Math.max(0, 1 - multiplier);
                    if (target.en) {
                        lossAmount = 0;
                    }

                    if (lossAmount > 0) {
                        worldState.serv[key].fidelityLoss *= 2;
                        loseXp('fidelity', lossAmount, key, worldState);
                    }
                }

                // publish event UUID A killed UUID b
                publish('death', { user: key, target: target.i })

                if (WorldState.isLoggedIn(key) && DefeatHooks[target.t]) {
                    DefeatHooks[target.t](key, worldState);
                }

                if (targetPriv.fidelityReward) {
                    gainXp('fidelity', targetPriv.fidelityReward, key, worldState);
                }

                setAnimation(target, 'die') || setAnimation(target, 'idle');
                setAnimation(user, 'idle');
                var killerName = WorldState.isLoggedIn(key) ? 'Player' : (user.dn ? user.dn : definitions[user.t].itemName);
                WorldState.markDeath(target, killerName, key);
                return false;
            }
            this.currentTick = 0;
            this.arrow = null;
        }

        var behavior = getBehavior(this.target);
        if (behavior && behavior.handleAttack) {
            behavior.handleAttack(user.i);
        }

        return true;
    }
    cleanUp(worldState) {
        if (this.attackOverride && this.attackOverride.cleanUp) {
            this.attackOverride.cleanUp(worldState);
        }
    }
}