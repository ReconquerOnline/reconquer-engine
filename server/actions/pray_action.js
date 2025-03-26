import { definitions, setAnimation } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { gainXp } from "../skills.js";

export default class PrayAction {
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

        var definition = definitions[target.t];

        if (!target || !definitions[target.t] || user.lf != target.lf || user.li != target.li || !definition || definition.type != 'altar') {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        setAnimation(user, 'praying');
        this.tick += 1;
        worldState.serv[key].tp += 100;
        worldState.serv[key].tp = Math.min(worldState.serv[key].tp, worldState.priv[key].kfl * 100)
        if (this.tick == 10) {
            this.tick = 0;
            var experience = definition.experience ? definition.experience : 0;
            gainXp('fidelity', experience, key, worldState);
        }

        return true;
    }
}