import { setAnimation } from "../loader.js";
import { sendCharacterMessage } from "../message.js";
import { gainXp } from "../skills.js";
import { getItemSlot, removeAmountFromSlot } from "../utils.js";

export default class FarmingPlotWaterUtilityAction {
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

        if (this.ticks == 0 && this.target.swa == 1) {
            sendCharacterMessage('This already looks watered.', key, worldState);
            setAnimation(user, 'idle');
            return false;
        }

        setAnimation(user, 'carve');
        this.ticks += 1;
        if (this.ticks == 2) {
            setAnimation(user, 'idle');
            var target = this.target;
            target.swa = 1;

            removeAmountFromSlot(itemSlot, 1, userPriv);
            var definition = this.items[0].interaction;
            if (definition.produces) {
                userPriv[itemSlot] = structuredClone(definition.produces);
            }

            gainXp('farming', 2, key, worldState);
            return false;
        }
        return true;
    }
}