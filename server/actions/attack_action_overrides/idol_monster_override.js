import { getAnimationTicks, setAnimation } from "../../loader.js";
import { generateUUID, getCombatantsAtLocation, getEntitiesAtLocation, getNearbyCharacters, matchesLocation } from "../../utils.js";
import * as WorldState from '../../world_state.js';

var offsets = [
    [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
    ],
    [
        [-1, 0],
        [0, -1],
        [0, 1],
        [1, 0],
    ]
];

export class IdolMonsterAttackOverride {
    constructor() {
        this.uuids = [];
        this.boulderTicks = 0;
        this.boulderMaxTicks = 4;
        this.type = 0;
    }

    getAnimation(target, user, worldState) {
        if (this.uuids.length == 0) {
            for (var offset of offsets[this.type]) {
                var uuid = generateUUID();
                this.uuids.push(uuid);

                var absX = user.lsx * 64 + user.lx + offset[0];
                var absY = user.lsy * 64 + user.ly + offset[1];
                WorldState.addObject({
                    i: uuid,
                    lsx: Math.floor(absX / 64),
                    lsy: Math.floor(absY / 64),
                    lx: absX % 64,
                    ly: absY % 64,
                    lr: 0,
                    lf: user.lf,
                    li: user.li,
                    t: 'falling_rock',
                    sa: 1
                }, {});
            }
            this.type = (this.type + 1) % 2;
            this.boulderTicks = 0;
        }
        return 'attack';
    }

    // keep track of boulder fall ticks, then clean up and advance to regular attack
    handleTick(worldState) {
        if (this.uuids.length == 0) return;
        this.boulderTicks += 1;
        if (this.boulderTicks == this.boulderMaxTicks - 1) {
            for (var i = 0; i < this.uuids.length; i++) {
                var combatants = getCombatantsAtLocation(worldState.pub[this.uuids[i]], worldState);
                for (var combatant of combatants) {
                    if (combatant.t == "idol_monster") continue;
                    combatant.hp -= 10;
                    if (combatant.hp < 0) combatant.hp = 0;
                    if (combatant.hp == 0) {
                        setAnimation(combatant, 'die');
                        WorldState.markDeath(combatant, 'Yammer');
                    }
                }
            }            
        } else if (this.boulderTicks == this.boulderMaxTicks) {
            for (var i = 0; i < this.uuids.length; i++) {
                WorldState.removeObject({ t: 'falling_rock', i: this.uuids[i] });
            }
            this.uuids = [];
        }
    }
    handleAttack(worldState) {
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