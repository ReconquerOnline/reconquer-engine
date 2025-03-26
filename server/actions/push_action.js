import { setAnimation } from "../loader.js";
import { rotateTowardsTargetNonBlocking } from "../action_utils.js";
import { distanceBetween, getSquareString, perpendicularDistanceBetween } from "../utils.js";
import { addDynamicCollision, canMoveToNextSquare, removeDynamicCollision } from "./move_action.js";

export default class PushAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;

    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target ||
            user.lf != target.lf ||
            user.li != target.li ||
            user.i == target.i ||
            user.t !== 'character' ||
            user.si !== 0 ||
            (target === 'character' && target.si !== 0) || 
            (target.t !== 'character' && target.t !== 'dog' && target.t !== 'packmule') ||
            perpendicularDistanceBetween(user, target) != 1) {
            setAnimation(user, 'idle')
            return false;
        }

        rotateTowardsTargetNonBlocking(user, target, key, worldState);

        this.tick += 1;
        if (this.tick == 1) {
            setAnimation(user, 'push');
            var canMove = canMoveToNextSquare(user, {
                segX: target.lsx,
                segY: target.lsy,
                x: target.lx,
                y: target.ly
            }, true, 0);
            if (!canMove) {
                return false;
            }
    
            var currentSegX = user.lsx;
            var currentSegY = user.lsy;
            var currentX = user.lx;
            var currentY = user.ly;
    
            var oldSquareString = getSquareString(
                currentSegX,
                currentSegY,
                currentX,
                currentY);
    
            user.lsx = Math.floor(canMove.x / 64);
            user.lsy = Math.floor(canMove.y / 64);
            user.lx = canMove.x % 64;
            user.ly = canMove.y % 64;
            user.lr = Math.atan2(canMove.xDir, canMove.yDir) * (2 / Math.PI) + 2;
    
            removeDynamicCollision({
                lsx: currentSegX,
                lsy: currentSegY,
                lx: currentX,
                ly: currentY,
                lf: user.lf,
                li: user.li
            }, 1);
            addDynamicCollision(user, 1);
    
            var newSquareString = getSquareString(
                user.lsx,
                user.lsy,
                user.lx,
                user.ly);
    
            if (oldSquareString != newSquareString) {
                delete worldState.squares[oldSquareString][key];
                worldState.squares[newSquareString][key] = true;
            }
            return true;
        } else if (this.tick == 2) {
            setAnimation(user, 'idle');
            return false;
        }
        return true;
    }
}