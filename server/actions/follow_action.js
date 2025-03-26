import { setAnimation } from "../loader.js";
import { moveTowardsTargetWithNonBlockingRotation } from "../action_utils.js";
import { distanceBetween } from "../utils.js";

export default class FollowAction {
    constructor(msg) {
        this.target = msg.ta;

    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li || user.i == target.i) {
            setAnimation(user, 'idle')
            return false;
        }

        if (distanceBetween(user, target) > 24) {
            setAnimation(user, 'idle')
            return false;
        }

        var oldPoint = {
            lsx: user.lsx,
            lsy: user.lsy,
            lx: user.lx,
            ly: user.ly,
            lr: user.lr
        }
        moveTowardsTargetWithNonBlockingRotation(user, target, key, worldState);
        if (distanceBetween(oldPoint, user) == 0) {
            if (oldPoint.lr != user.lr) {
                if (!setAnimation(user, 'turn')) {
                    setAnimation(user, 'idle');
                }
            } else {
                setAnimation(user, 'idle');
            }
        }
        return true;
    }
}