import ConfigOptions from "../config_options.js";
import { definitions, materialToLevelMap, materialToXPMap, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { addToFirstInventorySlot, getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot } from "../utils.js";

var productionMap = {
    1: '_ingot_small',
    2: '_ingot_medium',
    3: '_ingot_large',
    4: '_ingot_huge',
}

var oreToBarMap = {
    'copper': {
        produces: 'copper',
        alsoConsumes: [],
    },
    'zinc': {
        produces: 'brass',
        alsoConsumes: ['copper_ore']
    },
    'tin': {
        produces: 'bronze',
        alsoConsumes: ['copper_ore']
    },
    'nickel': {
        produces: 'nickelbronze',
        alsoConsumes: ['tin_ore', 'copper_ore']
    },
    'iron': {
        produces: 'iron',
        alsoConsumes: ['nickel_ore']
    }
    // iron, coal, etc
}

export default class FurnaceUtilityAction {
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

        var quantity = getTotalQuantityOfItemInInventory(this.itemId, userPriv);
        if (quantity == 0) {
            setAnimation(user, 'idle');
            return false;
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

            var material = this.itemId.split('_')[0];
            var minimumLevel = materialToLevelMap[material] ? materialToLevelMap[material] : 100;
            var level = getLevel('smithing', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' smithing to smelt this.', 'smithing.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var alsoConsumesList = oreToBarMap[material].alsoConsumes;
            var minAlsoConsumesQuantity = quantity;
            for (var alsoConsumes of alsoConsumesList) {
                var alsoConsumesQuantity = getTotalQuantityOfItemInInventory(alsoConsumes, userPriv);
                minAlsoConsumesQuantity = Math.min(alsoConsumesQuantity, minAlsoConsumesQuantity)
                if (alsoConsumesQuantity == 0) {
                    sendInfoTargetMessage('I also need ' + definitions[alsoConsumes].itemName.toLowerCase() + ' to smelt this.', 'smithing.svg', key, worldState);
                    setAnimation(user, 'idle');
                    return false;
                }
            }

            var numberToConsume = Math.min(4, quantity, minAlsoConsumesQuantity);
            var materialXp = materialToXPMap[material] ? materialToXPMap[material] : 0;
            gainXp('smithing', numberToConsume * materialXp, key, worldState);
            var productionId = oreToBarMap[material].produces + productionMap[numberToConsume];
            for (var i = 0; i < numberToConsume; i++) {
                removeAmountFromSlot(getItemSlot(this.itemId, userPriv), 1, userPriv);
                for (var alsoConsumes of alsoConsumesList) {
                    removeAmountFromSlot(getItemSlot(alsoConsumes, userPriv), 1, userPriv)
                }
            }
            addToFirstInventorySlot(userPriv, definitions[productionId], 1);
            this.ticks = 0;
            if (quantity != minAlsoConsumesQuantity) {
                setAnimation(user, 'idle');
                return false;
            }
        }
        return true;
    }
}