import ConfigOptions from "../config_options.js";
import { setAnimation } from "../loader.js";
import { sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { getItemSlot, linearInterpolate } from "../utils.js";

export default class CookingUtilityAction {
    constructor(target, items) {
        this.target = target;
        this.items = items;
        this.ticks = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        if (!this.itemId) {
            this.itemId = userPriv[this.items[0].slot][0];
        }

        var itemSlot = getItemSlot(this.itemId, userPriv);
        if (!itemSlot) {
            setAnimation(user, 'idle');
            return false;
        }

        setAnimation(user, 'cook');
        this.ticks += 1;
        if (this.ticks == 4) {
            var definition = this.items[0].interaction;
            var minimumLevel = definition.level ? definition.level : 100;
            var experience = definition.experience ? definition.experience : 0;
            var level = getLevel('cooking', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' cooking to cook this.', 'cooking.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            var success = Math.random() < linearInterpolate(0.5, 1, (level - minimumLevel) / 20);
            if (success) {
                userPriv[itemSlot] = [definition.success, 1];
                gainXp('cooking', experience, key, worldState);
            } else {
                userPriv[itemSlot] = [definition.failure, 1];
            }
            this.ticks = 0;
            setAnimation(user, 'idle');
        }
        return true;
    }
}