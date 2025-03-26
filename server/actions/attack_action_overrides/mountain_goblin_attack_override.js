import { getAnimationName } from "../../loader.js";

export class MountainGoblinAttackOverride {
    constructor() {

    }
    getAnimation(target, user, worldState, currentTick) {
        if (currentTick == 0 && Math.random() > 0.7) {
            return 'bow';
        } else if (currentTick == 0) {
            return 'slash';
        }
        var currentAnimation = getAnimationName(user, user.sa);
        return currentAnimation == 'bow' ? 'bow' : 'slash';
    }
}