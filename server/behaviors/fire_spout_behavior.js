import { dropItem } from "../action_utils.js";
import { definitions, setAnimation } from "../loader.js";
import { getEntitiesAtLocation } from "../utils.js";
import * as WorldState from '../world_state.js';

// create list of cookable objects
var cookingInteractions = {};
for (var itemId in definitions) {
    var definition = definitions[itemId]
    var cookingInteraction = definition.useSourceInteractions.filter(x => x.type == 'cooking_utility');
    if (cookingInteraction.length > 0) {
        cookingInteractions[itemId] = cookingInteraction[0];
    }
}

export default class FireSpoutBehavior {
    constructor(item, config) {
        this.item = structuredClone(item);

        this.oneOff = !item.priv.id.includes('3t') ? true : false;
        this.enabled = item.priv.id.includes('3t') ? true : false;
        this.numTicksOn = 3;
        this.numTicksOff = 3;
        this.animation = 2;
        this.intialTicksDelay = item.priv.id.includes('3d') ? 3 : 0;
        this.tick = -this.intialTicksDelay;
    }

    enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.tick = this.numTicksOff - 1;
        }
    }

    update(worldState) {
        var pub = worldState.pub[this.item.pub.i];

        if (this.enabled && this.tick >= this.numTicksOff - 1) {
            pub.sa = this.animation;
        }
        if (this.enabled && this.tick >= this.numTicksOff && this.tick < this.numTicksOff + this.numTicksOn) {
            // look at four squares
            var absX = pub.lsx * 64 + pub.lx;
            var absY = pub.lsy * 64 + pub.ly;
            var dirX = pub.lr == 0 ? -1 : pub.lr == 2 ? 1 : 0;
            var dirY = pub.lr == 1 ? 1 : pub.lr == 3 ? -1 : 0;
            for (var i = 0; i < 4; i++) {
                var locX = absX + dirX * i;
                var locY = absY + dirY * i;

                var entities = getEntitiesAtLocation({
                    lsx: Math.floor(locX / 64),
                    lsy: Math.floor(locY / 64),
                    lx: locX % 64,
                    ly: locY % 64,
                    li: pub.li,
                    lf: pub.lf
                }, worldState);
                entities.forEach(x => {
                    if (x.mhp && x.hp && !definitions[x.t].immuneToFire) {
                        x.hp -= 2;
                        if (x.hp < 0) x.hp = 0;
                        if (x.hp == 0) {
                            setAnimation(x, 'die');
                            WorldState.markDeath(x, 'Fire Spout');
                        }
                    } else if(cookingInteractions[x.t]) {
                        var interaction = cookingInteractions[x.t];
                        var result = Math.random();
                        if (result > 0.8) {
                            dropItem(interaction.success, 1, {
                                lsx: x.lsx,
                                lsy: x.lsy,
                                lx: x.lx,
                                ly: x.ly,
                                lf: x.lf,
                                li: x.li,
                                lr: 0,
                            }, worldState);
                        } else if (result > 0.6) {
                            dropItem(interaction.failure, 1, {
                                lsx: x.lsx,
                                lsy: x.lsy,
                                lx: x.lx,
                                ly: x.ly,
                                lf: x.lf,
                                li: x.li,
                                lr: 0,
                            }, worldState);
                        }
                    }
                });
            }
        }
        if (this.tick > this.numTicksOff + this.numTicksOn) {
            pub.sa = 0;
            this.tick = 0;
            if (this.oneOff) {
                this.enabled = false;
            }
        }

        this.tick += 1;
    }
}
