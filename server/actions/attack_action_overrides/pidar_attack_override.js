import { getAnimationName } from "../../loader.js";

export class PidarAttackOverride {
    constructor() {

    }
    getAnimation(target, user, worldState, currentTick) {
        if (currentTick == 0 && Math.random() > 0.5) {
            worldState.priv[user.i]['i0'] = ["water_ball", 999999999]
            return "right_bow"
        } else if (currentTick == 0) {
            worldState.priv[user.i]['i0'] = ["tornado_ball", 999999999]
            return "left_bow"
        }
        var currentAnimation = getAnimationName(user, user.sa);
        return currentAnimation;
    }
}