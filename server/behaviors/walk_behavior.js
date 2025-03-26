import * as WorldState from '../world_state.js';
import MoveAction from '../actions/move_action.js';

export default class WalkBehavior {
    constructor(item, config) {
        this.item = item;
        this.config = config;

        this.currentTick = Math.floor(Math.random() * this.config.frequency);
        this.startX = item.pub.lsx * 64 + item.pub.lx;
        this.startY = item.pub.lsy * 64 + item.pub.ly;
    }
    update() {
        if (this.currentTick == 0) {
            var targetX = this.startX + Math.round(Math.random() * this.config.distance);
            var targetY = this.startY + Math.round(Math.random() * this.config.distance);
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
        this.currentTick %= this.config.frequency;
    }
}
