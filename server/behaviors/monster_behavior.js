import * as WorldState from '../world_state.js';
import MoveAction from '../actions/move_action.js';
import AttackAction from '../actions/attack_action.js';
import RespawnBehavior from './respawn_behavior.js';
import { calculateCombatLevel, distanceBetween, getNearbyCharacters, absoluteToGridPoint, addToFirstInventorySlot } from '../utils.js';
import { dropItem, transportToPoint } from '../action_utils.js';
import AggressionOverrides from '../agression_overrides.js';
import { definitions, getAnimationName, setAnimation } from '../loader.js';

export default class MonsterBehavior {
    constructor(item, config) {
        this.item = item;
        this.config = config;

        this.frequency = config.frequency !== undefined ? config.frequency : 5;
        this.distance = config.distance !== undefined ? config.distance : 3
        this.maxDistance = config.maxDistance !== undefined ? config.maxDistance : 10;
        this.retaliate = config.retaliate === false ? false : true;

        this.currentTick = Math.floor(Math.random() * this.frequency);
        this.startX = item.pub.lsx * 64 + item.pub.lx;
        this.startY = item.pub.lsy * 64 + item.pub.ly;

        this.initialPub = structuredClone(this.item.pub);

        item.pub.hp = config.hitpoints ? config.hitpoints : 10;
        item.pub.mhp = item.pub.hp;

        item.priv.kac = config.accuracy ? config.accuracy : 1;
        item.priv.kdc = config.defense ? config.defense : 1;
        item.priv.ksc = config.strength ? config.strength : 1;
        item.priv.karc = config.archery ? config.archery : 1;
        item.pub.cbl = calculateCombatLevel(item.priv.kac, item.priv.ksc, item.priv.kdc, item.pub.mhp, item.priv.karc);

        if (config.overrideCombatLevel !== undefined) {
            item.pub.cbl = config.overrideCombatLevel;
        }

        item.priv.esld = config.slashDefense ? config.slashDefense : 0;
        item.priv.ecrd = config.crushDefense ? config.crushDefense : 0;
        item.priv.estd = config.stabDefense ? config.stabDefense : 0;
        item.priv.eard = config.archeryDefense ? config.archeryDefense : 0;
        item.priv.fidelityReward = config.fidelityReward ? config.fidelityReward : 0;

        this.respawn = config.respawn !== false;
        this.respawnBehavior = new RespawnBehavior(item, config);
        this.wander = config.wander ? config.wander : false;
        this.disappearTicks = config.disappearTicks ? config.disappearTicks : 0;
        this.attackTicks = 0;

        this.path = config.path ? config.path : null;
        this.pathIndex = 0;

        this.disableHitpointRegeneration = config.disableHitpointRegeneration ? config.disableHitpointRegeneration : false;
        this.ticksWithoutFighting = 0;
        this.previousSpots = [];
        this.previousSpotIndex = 0;
        this.isRetreating = false;
        this.nearbyCheckTicks = Math.floor(Math.random() * 3);
        this.lastAggresiveAttackTime = 0;
        this.customAggressionOverride = config.customAggressionOverride ? config.customAggressionOverride : null;
    }
    attackClosest(monster, worldState) {
        // sort by distance and attack closest
        var nearby = getNearbyCharacters(monster, this.config.aggressionDistance, worldState, true)
        
        if (!this.wander) {
            nearby = nearby.filter(obj => distanceBetween(this.initialPub, obj) <= this.maxDistance)
        }

        for (var i = 0; i < nearby.length; i++) {
            var char = nearby[i];
            var aggressionOverride = AggressionOverrides[monster.t];
            if (this.customAggressionOverride) {
                aggressionOverride = this.customAggressionOverride;
            }
            if (aggressionOverride && aggressionOverride(char.i, worldState)) {
                continue;
            }
            this.lastAggresiveAttackTime = Date.now();
            WorldState.addAction(
                this.item.pub.i,
                new AttackAction({
                    ta: char.i
                })
            );
            return true;
        }
        return false;
    }
    update(worldState) {
        var monster = worldState.pub[this.item.pub.i];
        if (!monster) {
            if (!this.respawn) {
                return true;
            }
            this.respawnBehavior.update(worldState)
            return;
        }

        var currentAction = WorldState.getAction(this.item.pub.i);

        if (!this.wander && distanceBetween(monster, this.initialPub) > this.maxDistance) {
            var continueAttacking = currentAction instanceof AttackAction && worldState.pub[currentAction.target] && distanceBetween(worldState.pub[currentAction.target], this.initialPub) <= this.maxDistance
            if (!continueAttacking) {
                if (this.isRetreating && this.config.aggressionDistance) {
                    if (this.attackClosest(monster, worldState)) {
                        this.isRetreating = false;
                        return;
                    }
                }
                this.isRetreating = true;
                WorldState.addAction(
                    this.item.pub.i,
                    new MoveAction({
                        segX: this.initialPub.lsx,
                        segY: this.initialPub.lsy,
                        x: this.initialPub.lx,
                        y: this.initialPub.ly
                    })
                );
                return;
            }

        }

        if (!currentAction) {
            this.isRetreating = false;
        }
        if (!(currentAction instanceof AttackAction)) {
            this.ticksWithoutFighting += 1;
            this.attackTicks = 0;
        } else {
            this.attackTicks += 1;
        }
        if (getAnimationName(monster, monster.sa) == 'disappear') {
            var furthestSpot = monster;
            var furthestDistance = 0;
            for (var spot of this.previousSpots) {
                var distance = distanceBetween(monster, spot);
                if (distance > furthestDistance) {
                    furthestDistance = distance;
                    furthestSpot = spot;
                }
            }
            transportToPoint(monster, furthestSpot, worldState);
            return;
        }
        if (this.disappearTicks && this.attackTicks > this.disappearTicks) {
            setAnimation(monster, 'disappear');
            this.attackTicks = 0;
            WorldState.removeAction(this.item.pub.i);
            return;
        }
        if (!this.disableHitpointRegeneration && this.ticksWithoutFighting > 50) {
            this.ticksWithoutFighting = 0;
            monster.hp = monster.mhp;
        }
        if (this.config.aggressionDistance &&
            !(currentAction instanceof AttackAction) &&
            !this.isRetreating &&
            Date.now() - this.lastAggresiveAttackTime > 6000) {

            if (this.nearbyCheckTicks >= 2) { // performance optimization
                this.nearbyCheckTicks = 0;
                if (this.attackClosest(monster, worldState)) {
                    return;
                }
            }
            this.nearbyCheckTicks += 1;
        }

        if (this.disappearTicks && this.currentTick == 0) {
            
            this.previousSpots.push({
                lsx: this.item.pub.lsx,
                lsy: this.item.pub.lsy,
                lx: this.item.pub.lx,
                ly: this.item.pub.ly,
                lr: this.item.pub.lr,
                lf: this.item.pub.lf,
                li: this.item.pub.li
            });
            if (this.previousSpots.length > 10) {
                this.previousSpots.shift();
            }
        }

        if ((!currentAction && (this.currentTick == 0 || this.wander))) {
            var targetX = this.startX + Math.round((Math.random()-.5) * this.distance);
            var targetY = this.startY + Math.round((Math.random()-.5) * this.distance);
            if (this.wander) {
                if (this.path) {
                    targetX = this.startX  + this.path[this.pathIndex % this.path.length][0];
                    targetY = this.startY + this.path[this.pathIndex % this.path.length][1];
                    this.pathIndex += 1;
                } else {
                    targetX = this.item.pub.lsx * 64 + this.item.pub.lx + Math.round((Math.random()-.5) * this.distance);
                    targetY = this.item.pub.lsy * 64 + this.item.pub.ly + Math.round((Math.random()-.5) * this.distance);
                }
            }
            WorldState.addAction(
                this.item.pub.i,
                new MoveAction({
                    segX: Math.floor(targetX / 64),
                    segY: Math.floor(targetY / 64),
                    x: targetX % 64,
                    y: targetY % 64
                })
            );
        }
        this.currentTick += 1;
        this.currentTick %= this.frequency;
    }
    handleAttack(target) {
        if (this.isRetreating) return;
        var currentAction = WorldState.getAction(this.item.pub.i);
        if (currentAction && currentAction instanceof AttackAction) return;
        if (this.retaliate == false) return;
        this.ticksWithoutFighting = 0;
        WorldState.addAction(
            this.item.pub.i,
            new AttackAction({
                ta: target
            })
        );
    }
    chooseDrop(worldState, monster, dropTable, offset, killerId) {
        var roll = Math.floor(Math.random() * 1000);
        var i = 0;
        var id, quantity;
        while (dropTable[i] !== undefined && roll > dropTable[i][0]) {
            var result = dropTable[i][1];
            id = typeof result === 'string' ? result : result[0];
            quantity = typeof result === 'string' ? 1 : result[1];
            i += 1;
        }

        var absoluteX = 64 * monster.lsx + Math.floor(monster.lx) + offset[0];
        var absoluteY = 64 * monster.lsy + Math.floor(monster.ly) + offset[1];
        var gridPoint = absoluteToGridPoint(absoluteX, absoluteY);
        if (id) {

            if (killerId && worldState.serv[killerId] && definitions[id].collectionLog) {
                // update collection log
                if (!worldState.serv[killerId].collection[id]) {
                    worldState.serv[killerId].collection[id] = 0;
                }
                worldState.serv[killerId].collection[id] += quantity;
            }

            // if stackable and wearing accumulator, try to add to inventory
            if (killerId &&  worldState.priv[killerId] && worldState.priv[killerId].in == 'necklace_accumulator' && definitions[id].stackable) {
                if (addToFirstInventorySlot(worldState.priv[killerId], definitions[id], quantity)) {
                    return;
                }
            }

            dropItem(id, quantity, {
                lsx: gridPoint.segX,
                lsy: gridPoint.segY,
                lx: gridPoint.x,
                ly: gridPoint.y,
                lf: monster.lf,
                li: monster.li,
                lr: 0,
            }, worldState, {}, { despawnTime: 60 });
        }
    }
    handleDeath(worldState, killerId) {
        var monster = worldState.pub[this.item.pub.i];

        WorldState.removeObject(worldState.pub[this.item.pub.i]);
        if (!this.config.dropTable) return;
        var dropTable = this.config.dropTable;
        if (typeof dropTable[0][0] == 'number') {
            dropTable = [dropTable];
        }
        var order = [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1]
        ];

        if (this.config.dropOffset) {
            for (var i = 0; i < 4; i++) {
                order[i][0] += this.config.dropOffset[0];
                order[i][1] += this.config.dropOffset[1];
            }
        }

        var i = 0;
        for (var table of dropTable) {
            this.chooseDrop(worldState, monster, table, order[i], killerId);
            i += 1;
        }
    }
}