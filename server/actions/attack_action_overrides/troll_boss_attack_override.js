import { setAnimation } from "../../loader.js";
import { generateUUID, getCombatantsAtLocation, getNearbyCharacters, matchesLocation } from "../../utils.js";
import * as WorldState from '../../world_state.js';
import { GiantGoblinAttackOverride } from "./giant_goblin_attack_override.js";

export class TrollBossAttackOverride extends GiantGoblinAttackOverride {
    constructor() {
        super();
        this.fireSpouts = WorldState.getObjectsWithId('fire_spout_custom.troll_boss');
        this.spoutTicks = 0;
    }
    getAnimation(target, user, worldState) {
        if (this.hitsLanded % 6 == 0) {
            if (this.uuids.length == 0) {
                for (var i = 0; i < this.fireSpouts.length; i++) {
                    worldState.pub[this.fireSpouts[i]].sa = 1;
                    this.spoutTicks = 1;
                }
            }
        }
        return super.getAnimation(target, user, worldState);
    }
    handleTick(worldState) {

        super.handleTick(worldState);
        if (this.spoutTicks > 0 && this.spoutTicks < 4) {
            // get all characters interesecting...
            for (var j = 0; j < this.fireSpouts.length; j++) {
                var pub = worldState.pub[this.fireSpouts[j]];

                var absX = pub.lsx * 64 + pub.lx;
                var absY = pub.lsy * 64 + pub.ly;
                var dirX = pub.lr == 0 ? -1 : pub.lr == 2 ? 1 : 0;
                var dirY = pub.lr == 1 ? 1 : pub.lr == 3 ? -1 : 0;
                for (var i = 0; i < 4; i++) {
                    var locX = absX + dirX * i;
                    var locY = absY + dirY * i;
                    var combatants = getCombatantsAtLocation({
                        lsx: Math.floor(locX / 64),
                        lsy: Math.floor(locY / 64),
                        lx: locX % 64,
                        ly: locY % 64,
                        li: pub.li,
                        lf: pub.lf
                    }, worldState);
                    combatants.forEach(x => {
                        x.hp -= 2;
                        if (x.hp < 0) x.hp = 0;
                        if (x.hp == 0) {
                            setAnimation(x, 'die');
                            WorldState.markDeath(x);
                        }
                    });
                }
            }
        } else if (this.spoutTicks >= 4) {
            for (var i = 0; i < this.fireSpouts.length; i++) {
                worldState.pub[this.fireSpouts[i]].sa = 0;
            }
            this.spoutTicks = 0;
        }
        if (this.spoutTicks > 0) {
            this.spoutTicks += 1;
        }
    }
    cleanUp(worldState) {
        super.cleanUp();
        for (var i = 0; i < this.fireSpouts.length; i++) {
            worldState.pub[this.fireSpouts[i]].sa = 0;
        }
    }
}