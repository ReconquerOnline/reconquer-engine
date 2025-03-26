import { canMoveToNextSquare } from '../actions/move_action.js';
import { setAnimation } from '../loader.js';
import { getPlayersAtLocation } from '../utils.js';
import * as WorldState from '../world_state.js';

export default class ProjectileBehavior {
    constructor(item, config) {
        this.item = item;
        this.config = config;

        this.currentTick = Math.floor(Math.random() * this.config.frequency);
        this.startX = item.pub.lsx * 64 + item.pub.lx;
        this.startY = item.pub.lsy * 64 + item.pub.ly;

        this.damage = config.damage ? config.damage : 0;
        this.relativePath = config.relativePath ? config.relativePath : null;
        this.pathIndex = 0;

        this.wander = config.wander ? config.wander : false;
        this.wanderDistance = config.wanderDistance ? config.wanderDistance : 0;
        this.wanderTarget = this.getWanderTarget();
    }
    getWanderTarget() {
        var targetX = this.startX + Math.round((Math.random()-.5) * 2 * this.wanderDistance);
        var targetY = this.startY + Math.round((Math.random() - .5) * 2 * this.wanderDistance);

        var target = {
            segX: Math.floor(targetX / 64),
            segY: Math.floor(targetY / 64),
            x: targetX % 64,
            y: targetY % 64
        }
        return target;
    }
    update(worldState) {

        var pub = worldState.pub[this.item.pub.i];

        var players = getPlayersAtLocation(pub, worldState);
        players.forEach(x => {
            if (x.mhp && x.hp) {
                x.hp -= this.damage;
                if (x.hp < 0) x.hp = 0;
                if (x.hp == 0) {
                    setAnimation(x, 'die');
                    WorldState.markDeath(x, 'Projectile');
                }
            }
        });

        if (this.wander) {
            var canMove = canMoveToNextSquare(pub, this.wanderTarget, true, 0);
            while (!canMove) {
                this.wanderTarget = this.getWanderTarget();
                canMove = canMoveToNextSquare(pub, this.wanderTarget, true, 0);
            }
            pub.lsx = Math.floor(canMove.x / 64);
            pub.lsy = Math.floor(canMove.y / 64);
            pub.lx = canMove.x % 64;
            pub.ly = canMove.y % 64;
        } else if (this.relativePath) {
            var movement = this.relativePath[this.pathIndex];

            var absX = pub.lsx * 64 + pub.lx + movement[0];
            var absY = pub.lsy * 64 + pub.ly + movement[1];
            
            pub.lsx = Math.floor(absX / 64);
            pub.lsy =  Math.floor(absY / 64);
            pub.lx = absX % 64;
            pub.ly = absY % 64;

            this.pathIndex += 1;
            if (this.pathIndex >= this.relativePath.length) {
                this.pathIndex = 0;
            }
        }

        var players = getPlayersAtLocation(pub, worldState);
        players.forEach(x => {
            if (x.mhp && x.hp) {
                x.hp -= this.damage;
                if (x.hp < 0) x.hp = 0;
                if (x.hp == 0) {
                    setAnimation(x, 'die');
                    WorldState.markDeath(x, 'Projectile');
                }
            }
        });
    }
}
