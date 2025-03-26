import { dropItem } from '../action_utils.js';
import { setAnimation } from '../loader.js';
import { getCombatantsNotImmuneToFireAtLocation } from '../utils.js';
import * as WorldState from '../world_state.js';

export default class DespawnBehavior {
    constructor(item, config) {
        this.item = item;
        this.config = config;
        this.despawnTime = config.despawnTime;
        this.spawnItem = config.spawnItem;
        this.damage = config.damage;
        this.damageTicks = config.damageTicks ? config.damageTicks : 3;
        this.tickCount = 0;
    }
    update(worldState) {
        var pub = this.item.pub;
        if (!worldState.pub[pub.i]) return true;
        this.tickCount += 1;

        if (this.damage) {
            var combatants = getCombatantsNotImmuneToFireAtLocation(worldState.pub[pub.i], worldState);
            for (var x of combatants) {
                // make new accounts immune to fire
                if (worldState.priv[x.i].kfie === 0) continue;
                x.hp -= this.damage;
                if (x.hp < 0) x.hp = 0;
                if (x.hp == 0) {
                    setAnimation(x, 'die');
                    WorldState.markDeath(x, 'Fire');
                }
                this.damageTicks -= 1;
            }
        }

        if (this.tickCount > this.despawnTime / 0.6 || this.damageTicks == 0) {
            WorldState.removeObject(this.item.pub);
            if (this.spawnItem) {
                dropItem(this.spawnItem, 1, {
                    lsx: pub.lsx,
                    lsy: pub.lsy,
                    lx: pub.lx,
                    ly: pub.ly,
                    lf: pub.lf,
                    li: pub.li,
                    lr: 0
                }, worldState);
            }
            return true;
        }
    }
}
