import { getAnimationTicks, setAnimation } from "../../loader.js";
import { generateUUID, getNearbyCharacters, matchesLocation } from "../../utils.js";
import * as WorldState from '../../world_state.js';

export class GiantGoblinAttackOverride {
    constructor() {
        this.hitsLanded = Math.floor(Math.random() * 6);
        this.uuids = [];
        this.targets = [];
        this.boulderTicks = 0;
        this.boulderMaxTicks = 3;
    }

    getAnimation(target, user, worldState) {
        if (this.hitsLanded % 6 == 0) {
            if (this.uuids.length == 0) {
                var nearby = getNearbyCharacters(user, 4, worldState);
                for (var i = 0; i < Math.min(4, nearby.length); i++) {
                    var uuid = generateUUID();
                    this.uuids.push(uuid);
                    this.targets.push(nearby[i].i);
                    WorldState.addObject({
                        i: uuid,
                        lsx: nearby[i].lsx,
                        lsy: nearby[i].lsy,
                        lx: nearby[i].lx,
                        ly: nearby[i].ly,
                        lr: 0,
                        lf: nearby[i].lf,
                        li: nearby[i].li,
                        t: 'falling_rock',
                        sa: 0
                    }, {});
                }
                this.boulderTicks = 0;
                this.boulderMaxTicks = getAnimationTicks(user, 'stomp') - 1;
            }
            return 'stomp';
        }
        return 'attack';
    }
    // keep track of boulder fall ticks, then clean up and advance to regular attack
    handleTick(worldState) {
        if (this.uuids.length == 0) return;
        this.boulderTicks += 1;
        if (this.boulderTicks == this.boulderMaxTicks) {
            for (var i = 0; i < this.uuids.length; i++) {
                for (var j = 0; j < this.targets.length; j++) {
                    var target = worldState.pub[this.targets[j]];
                    if (matchesLocation(worldState.pub[this.uuids[i]], target)) {
                        target.hp -= 5;
                        if (target.hp < 0) target.hp = 0;
                        if (target.hp == 0) {
                            setAnimation(target, 'die');
                            WorldState.markDeath(target, 'Falling Rock');
                        }
                    }
                }
                WorldState.removeObject({ t: 'falling_rock', i: this.uuids[i] });
            }
            this.uuids = [];
            this.targets = [];
            this.hitsLanded += 1;
        }
    }
    handleAttack(worldState) {
        this.hitsLanded += 1;
        if (this.boulderTicks == this.boulderMaxTicks) {
            this.boulderTicks = 0;
            return 0;
        }
    }
    cleanUp() {
        for (var i = 0; i < this.uuids.length; i++) {
            WorldState.removeObject({ t: 'falling_rock', i: this.uuids[i] });
        }
        this.uuids = [];
        this.targets = [];
    }
}