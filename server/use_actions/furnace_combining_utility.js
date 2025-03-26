import { definitions, materialToXPMap, setAnimation } from "../loader.js";
import { sendCharacterMessage } from "../message.js";
import { gainXp } from "../skills.js";
import { addToFirstInventorySlot, getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot } from "../utils.js";

export default class FurnaceCombiningUtilityAction {
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

        if (!this.material) {
            this.material = userPriv[this.items[0].slot][0].split('_')[0];
        }
        setAnimation(user, 'cook');
        this.ticks += 1;
        if (this.ticks == 4) {
            setAnimation(user, 'idle');

            if (userPriv.ihan == '') {
                user.hp -= 3;
                user.hp = Math.max(1, user.hp);
                sendCharacterMessage('Ouch! I need to wear gloves.', key, worldState);
                return false;
            }

            var material = this.material;
            var quantitySmall = getTotalQuantityOfItemInInventory(material + '_ingot_small', userPriv);
            var quantityMedium = getTotalQuantityOfItemInInventory(material + '_ingot_medium', userPriv);
            var quantityLarge = getTotalQuantityOfItemInInventory(material + '_ingot_large', userPriv);
            // calculate number of loose to combine
            if (quantitySmall + quantityMedium + quantityLarge <= 1) {
                setAnimation(user, 'idle');
                return false;
            }

            var numRemoved = 0;
            while (quantitySmall > 0 && numRemoved < 4) {
                removeAmountFromSlot(getItemSlot(material + '_ingot_small', userPriv), 1, userPriv);
                quantitySmall -= 1;
                numRemoved += 1;
            }
            while (quantityMedium > 0 && numRemoved < 4) {
                removeAmountFromSlot(getItemSlot(material + '_ingot_medium', userPriv), 1, userPriv);
                quantityMedium -= 1;
                numRemoved += 2;
            }
            while (quantityLarge > 0 && numRemoved < 4) {
                removeAmountFromSlot(getItemSlot(material + '_ingot_large', userPriv), 1, userPriv);
                quantityLarge -= 1;
                numRemoved += 3;
            }
            if (numRemoved == 2) {
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_medium'], 1);
            } else if (numRemoved == 3) {
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_large'], 1);
            } else if (numRemoved == 4) {
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_huge'], 1);
            } else if (numRemoved == 5) {
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_huge'], 1);
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_small'], 1);
                quantitySmall += 1;
            } else if (numRemoved == 6) {
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_huge'], 1);
                addToFirstInventorySlot(userPriv, definitions[material + '_ingot_medium'], 1);
                quantityMedium += 1;
            }

            if (quantitySmall + quantityMedium + quantityLarge <= 1) {
                setAnimation(user, 'idle');
                return false;
            }
            this.ticks = 0;
        }
        return true;
    }
}