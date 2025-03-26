import { getAnimationName } from "../../loader.js";

export class DragonRangerOverride {
    constructor() {

    }
    getAnimation(target, user, worldState, currentTick) {
        var currentAnimation = getAnimationName(user, user.sa);
        if (currentTick == 0 && Math.random() > 0.5) {
            worldState.priv[user.i]['i0'] = ["invisible_fire_ball", 999999999];
            worldState.priv[user.i]['iw'] = "wooden_longbow";
            return "fire_bow"
        } else if (currentTick == 0) {
            worldState.priv[user.i]['i0'] = ["tornado_ball", 999999999];
            worldState.priv[user.i]['iw'] = "wooden_longbow";
            return "wind_bow"
        }
        if (currentAnimation == "fire_bow" || currentAnimation == "wind_bow") return currentAnimation;
        return "fire_bow";
    }
}