import { setAnimation } from "../loader.js";
import { rotateTowardsTarget } from "../action_utils.js";

export default class RotateAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle')
            return false;
        }

        var persist = rotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };
        setAnimation(user, 'idle');
        return false;
    }
}