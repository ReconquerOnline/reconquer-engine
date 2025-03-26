import { getAnimationName, setAnimation } from "../../loader.js";
import { distanceBetween, generateUUID, getPlayersAtLocation } from "../../utils.js";
import * as WorldState from '../../world_state.js';

var positions = [
    [0,1], [-1,1],[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1]
]

export class ChickenBossAttackOverride {
    constructor() {
        this.uuid = null;
        this.tornadoTicks = 0;
        this.selfId = null;
    }
    getAnimation(target, user, worldState, currentTick) {
        if (currentTick == 0 && this.tornadoTicks == 0 && user.hp < user.mhp / 2) {
            this.tornadoTicks = 1;
            this.selfId = user.i;
            return 'spin';
        } else if (currentTick == 0 && distanceBetween(user, target) > 2) {
            return 'bow';
        } else if (currentTick == 0) {
            return 'slash';
        }
        var currentAnimation = getAnimationName(user, user.sa);
        return currentAnimation == 'bow' ? 'bow' : ('spin' ? 'spin' : 'attack');
    }
    handleTick(worldState) {
        if (this.tornadoTicks == 0) return;
        var chicken = worldState.pub[this.selfId];
        if (!chicken) return;
        if (this.tornadoTicks == 1) {
            // create tornado
            this.uuid = generateUUID();

            WorldState.addObject({
                i: this.uuid,
                lsx: chicken.lsx,
                lsy: chicken.lsy,
                lx: chicken.lx,
                ly: chicken.ly,
                lr: 0,
                lf: chicken.lf,
                li: chicken.li,
                t: 'tornado',
                sa: 0
            }, {});
        } else {
            var tornado = worldState.pub[this.uuid];
            if (!tornado) return;

            var players = getPlayersAtLocation(tornado, worldState);
            players.forEach(x => {
                if (x.mhp && x.hp) {
                    x.hp -= 8;
                    if (x.hp < 0) x.hp = 0;
                    if (x.hp == 0) {
                        setAnimation(x, 'die');
                        WorldState.markDeath(x, 'Featherstorm');
                    }
                }
            });

            // move tornado
            var position = positions[(this.tornadoTicks - 2) % 8];
            var absX = chicken.lsx * 64 + chicken.lx + position[0];
            var absY = chicken.lsy * 64 + chicken.ly + position[1];
            tornado.lsx = Math.floor(absX / 64);
            tornado.lsy = Math.floor(absY / 64);
            tornado.lx = absX % 64;
            tornado.ly = absY % 64;

            players = getPlayersAtLocation(tornado, worldState);
            players.forEach(x => {
                if (x.mhp && x.hp) {
                    x.hp -= 8;
                    if (x.hp < 0) x.hp = 0;
                    if (x.hp == 0) {
                        setAnimation(x, 'die');
                        WorldState.markDeath(x, 'Featherstorm');
                    }
                }
            });
        }

        this.tornadoTicks += 1;

    }
    cleanUp() {
        if(this.uuid){
            WorldState.removeObject({ t: 'tornado', i: this.uuid });
        }
    }
}