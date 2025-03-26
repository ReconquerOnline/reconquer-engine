import { getAnimationName, setAnimation } from "../../loader.js";
import { generateUUID, getNearbyCharacters, getSquareString, matchesLocation, perpendicularDistanceBetween } from "../../utils.js";
import * as WorldState from '../../world_state.js';
/*
Stomp
    Boulders fall on all characters + 4 random squares around them
Breath
    Fire breaths out, hurts all players three squares in front
fire/wind
    Very strong but prayable
        80?
attack
    Strong - LVL 60ish?
spin
   Hits everyone within one square 
*/

var offsets = [
    [
        [0,0],
        [-1, -1],
        [0, -1],
        [1, 0],
        [0, 1]
    ],
    [
        [0, 0],
        [-1, 1],
        [-1, 0],
        [1, 1],
        [1, -1]
    ]
];
var animations = ["spin", "fire_bow", "wind_bow", "breath", "stomp"];

export class DragonBossOverride {
    constructor() {
        this.uuids = [];
        this.targets = [];
        this.boulderTicks = 0;
        this.boulderMaxTicks = 4;
        this.type = 0;
        this.selfId = null;
    }
    getAnimation(target, user, worldState, currentTick) {
        this.selfId = user.i;
        var random = Math.random();
        var currentAnimation = getAnimationName(user, user.sa);
        if (currentTick == 0 && random > 0.9) {
            return 'spin';
        } else if (currentTick == 0 && random > 0.75 && this.uuids.length == 0) {
            // create boulders
            var nearby = getNearbyCharacters(user, 16, worldState);
            for (var i = 0; i < Math.min(4, nearby.length); i++) {
                this.targets.push(nearby[i].i);
                for (var offset of offsets[this.type]) {
                    var uuid = generateUUID();
                    this.uuids.push(uuid);
                    var absX = nearby[i].lsx * 64 + nearby[i].lx + offset[0];
                    var absY = nearby[i].lsy * 64 + nearby[i].ly + offset[1];

                    WorldState.addObject({
                        i: uuid,
                        lsx: Math.floor(absX / 64),
                        lsy: Math.floor(absY / 64),
                        lx: absX % 64,
                        ly: absY % 64,
                        lr: 0,
                        lf: nearby[i].lf,
                        li: nearby[i].li,
                        t: 'falling_rock',
                        sa: 1
                    }, {});
                    this.type = Math.floor(Math.random() * offsets.length);
                }
            }
            this.boulderTicks = 0;
            return 'stomp';
        } else if ((currentTick == 0 || currentAnimation == 'walk') && perpendicularDistanceBetween(user, target) > 2) {
            if (Math.random() > 0.5) {
                worldState.priv[user.i]['i0'] = ["invisible_fire_ball", 999999999];
                worldState.priv[user.i]['iw'] = "wooden_longbow";
                return "fire_bow"
            } else {
                worldState.priv[user.i]['i0'] = ["tornado_ball", 999999999];
                worldState.priv[user.i]['iw'] = "wooden_longbow";
                return "wind_bow"
            }
        } else if (currentTick == 0) {
            return 'attack';
        }
        if (animations.indexOf(currentAnimation) != -1) {
            return currentAnimation;
        }
        return 'attack';
    }
    handleTick(worldState) {
        if (this.uuids.length == 0) return;
        this.boulderTicks += 1;
        if (this.boulderTicks == this.boulderMaxTicks - 1) {
            for (var i = 0; i < this.uuids.length; i++) {
                for (var j = 0; j < this.targets.length; j++) {
                    var target = worldState.pub[this.targets[j]];
                    if (matchesLocation(worldState.pub[this.uuids[i]], target)) {
                        target.hp -= 10;
                        if (target.hp < 0) target.hp = 0;
                        if (target.hp == 0) {
                            setAnimation(target, 'die');
                            WorldState.markDeath(target, 'Bluefire');
                        }
                    }
                }
            }
        } else if (this.boulderTicks == this.boulderMaxTicks) {
            for (var i = 0; i < this.uuids.length; i++) {
                WorldState.removeObject({ t: 'falling_rock', i: this.uuids[i] });
            }
            this.uuids = [];
            this.targets = [];
        }
    }
    handleAttack(worldState) {
        var user = worldState.pub[this.selfId];
        var currentAnimation = getAnimationName(user, user.sa);
        // handle spin
        if (currentAnimation == 'spin') {
            var nearby = getNearbyCharacters(user, 2.1, worldState, true);
            for (var target of nearby) {
                target.hp -= 8;
                if (target.hp < 0) target.hp = 0;
                if (target.hp == 0) {
                    setAnimation(target, 'die');
                    WorldState.markDeath(target, 'Bluefire');
                }
            }
        }

        if (currentAnimation == 'attack' || currentAnimation == 'fire_bow' || currentAnimation == 'wind_bow') return;
        return 0;
    }
    cleanUp() {
        for (var i = 0; i < this.uuids.length; i++) {
            WorldState.removeObject({ t: 'falling_rock', i: this.uuids[i] });
        }
        this.uuids = [];
        this.targets = [];
    }
}