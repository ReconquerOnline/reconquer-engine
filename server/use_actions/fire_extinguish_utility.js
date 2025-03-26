import { dropItem } from "../action_utils.js";
import { setAnimation } from "../loader.js";
import { getItemSlot, removeAmountFromSlot } from "../utils.js";

export default class FireExtinguishUtilityAction {
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

        setAnimation(user, 'pick');
        this.ticks += 1;
        if (this.ticks == 2) {
            this.ticks = 0;

            // make sure target is a fire
            if (this.target.t != 'fire') {
                setAnimation(user, 'idle');
                return false;
            }

            dropItem('ashes', 1, this.target, worldState)


            removeAmountFromSlot(itemSlot, 1, userPriv);
            var definition = this.items[0].interaction;
            if (definition.produces) {
                userPriv[itemSlot] = structuredClone(definition.produces);
            }

            setAnimation(user, 'idle');
            return false;
        }
        return true;
    }
}