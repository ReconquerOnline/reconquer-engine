import { getCombatantsNotImmuneToFireAtLocation, getItemsAtLocation } from '../utils.js';
import { definitions, setAnimation } from "../loader.js";
import * as WorldState from '../world_state.js';

export default class RespawnBehavior {
    constructor(item, config) {
        this.item = structuredClone(item);
        this.config = config;
        this.respawnTime = config.respawnTime;
        this.damage = config.damage;
        this.damageTicks = config.damageTicks ? config.damageTicks : 3;
        this.ticksEmpty = 0;
    }
    update(worldState) {
        var exists = worldState.pub[this.item.pub.i] !== undefined;
        if (exists) {
            if (this.damage) {
                var combatants = getCombatantsNotImmuneToFireAtLocation(worldState.pub[this.item.pub.i], worldState);
                for (var x of combatants) {
                    x.hp -= this.damage;
                    if (x.hp < 0) x.hp = 0;
                    if (x.hp == 0) {
                        setAnimation(x, 'die');
                        WorldState.markDeath(x, 'Fire');
                    }
                    this.damageTicks -= 1;
                }
            }

            this.ticksEmpty = 0;
            return;
        }

        if (this.config.itemId && this.ticksEmpty > this.respawnTime / 0.6 && getItemsAtLocation(this.item.pub, worldState, definitions).length != 0) {
            this.ticksEmpty = 0;
            return;
        }
        this.ticksEmpty += 1;
        if (this.ticksEmpty > this.respawnTime / 0.6) {
            WorldState.addObject(
                structuredClone(this.item.pub),
                structuredClone(this.item.priv)
            );
            this.ticksEmpty = 0;
        }
    }
}
