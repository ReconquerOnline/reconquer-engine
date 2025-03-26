import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage } from "../message.js";
import { gainXp } from "../skills.js";
import { addToFirstInventorySlot } from "../utils.js";

export default class WeedAction {
    constructor(msg) {
        this.target = msg.ta;
        this.ticks = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (definitions[target.t].behavior.type != 'farming_plot') {
            setAnimation(user, 'idle')
            return;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (this.ticks == 0 && target.swe == 0 && target.sd == 0) {
            sendCharacterMessage('This already looks cleared.', key, worldState);
            setAnimation(user, 'idle');
            return false;
        }

        if (Math.random() > 0.8) {
            addToFirstInventorySlot(worldState.priv[key], definitions['worms'], 1)
        }

        setAnimation(user, 'fish');
        this.ticks += 1;
        if (this.ticks == 8) {
            setAnimation(user, 'idle');
            target.swe = 0;
            target.si = 0;
            gainXp('farming', 2, key, worldState);
            if (target.sd == 1) {
                target.sd = 0;
                target.sst = 0;
            }
            return false;
        }
        return true;
    }
}