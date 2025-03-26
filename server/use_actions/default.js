import { dropItem } from "../action_utils.js";
import ConfigOptions from "../config_options.js";
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { addToFirstInventorySlot, canAddToInventory, getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot } from "../utils.js";

export default class DefaultAction {
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
        if (userPriv[this.items[0].slot][0] != this.itemId) {
            setAnimation(user, 'idle');
            return false;
        }
        var items = this.items.filter(item => userPriv[item.slot][0] == this.itemId);

        var interaction = items[0].interaction;

        setAnimation(user, interaction.animation);
        this.ticks += 1;
        if (this.ticks == interaction.ticks) {
            setAnimation(user, 'idle');

            for (var i = 0; i < items.length; i++) {
                if (userPriv[items[i].slot][0] != this.itemId) {
                    return false;
                }
            }

            var quantity = interaction.quantity ? interaction.quantity : 1;
            var resultArray = typeof interaction.result == 'string' ? [interaction.result] : interaction.result;
            var resultIndex = Math.min(resultArray.length - 1, items.length - 1);
            var result = resultArray[resultIndex];

            var experience = interaction.experience ? interaction.experience : 0;
            var minimumLevel = interaction.level ? interaction.level : 1;
            var skill = interaction.skill ? interaction.skill : 'crafting';
            var level = getLevel(skill, key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' ' + skill + '.', skill + '.svg', key, worldState);
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var sourceId = this.itemId;
            var sourceSlot = items[0].slot;
            var sourceQuantity = userPriv[sourceSlot][1];
            var targetId, targetSlot, targetQuantity;

            var inputQuantity = quantity;

            // validate consumesTarget exists
            if (interaction.consumesTarget) {
                targetId = this.target.t;
                targetSlot = getItemSlot(this.target.t, userPriv)
                if (!targetSlot) {
                    return false;
                }
                targetQuantity = userPriv[targetSlot][1];
            }

            var alsoConsumesList = [];
            if (interaction.alsoConsumes) {
                if (typeof interaction.alsoConsumes[0] == 'string') {
                    alsoConsumesList = [interaction.alsoConsumes]
                } else {
                    alsoConsumesList = interaction.alsoConsumes;
                }
            }

            var removedItems = [];
            for (var i = 0; i < alsoConsumesList.length; i++) {
                var entry = alsoConsumesList[i];
                var alsoConsumesId = entry[0];
                var alsoConsumesSlot = getItemSlot(alsoConsumesId, userPriv);
                var alsoConsumesQuantity = entry[1];
                removedItems.push([alsoConsumesSlot, alsoConsumesQuantity, alsoConsumesId]);
                if (!alsoConsumesSlot || userPriv[alsoConsumesSlot][1] < alsoConsumesQuantity) {
                    sendCharacterMessage("I need at least " + alsoConsumesQuantity + ' ' + definitions[alsoConsumesId].itemName.toLowerCase() + '.', key, worldState)
                    return false;
                }
            }

            // remove consumesTarget
            if (interaction.consumesTarget) {
                inputQuantity = Math.min(quantity, targetQuantity, sourceQuantity);
                removeAmountFromSlot(targetSlot, inputQuantity, userPriv);
            } else {
                if (sourceQuantity < quantity) {
                    sendCharacterMessage("I need at least " + quantity + ' ' + definitions[sourceId].itemName.toLowerCase() + '.', key, worldState)
                    return false;
                }
            }

            for (var i = 0; i < removedItems.length; i++) {
                var item = removedItems[i]
                removeAmountFromSlot(item[0], item[1], userPriv);
            }

            removeAmountFromSlot(sourceSlot, inputQuantity, userPriv);

            var outputQuantity = 1;
            if (definitions[result].stackable) {
                outputQuantity = Math.min(inputQuantity, quantity);
            }

            if (canAddToInventory(userPriv, definitions[result], outputQuantity)) {
                addToFirstInventorySlot(userPriv, definitions[result], outputQuantity);

                if (interaction.alsoProduces) {
                    var alsoProducesId = interaction.alsoProduces[0];
                    var alsoProducesQuantity = interaction.alsoProduces[1];
                    if (!addToFirstInventorySlot(userPriv, definitions[alsoProducesId], alsoProducesQuantity)) {
                        dropItem(alsoProducesId, alsoProducesQuantity, user, worldState);
                        sendCharacterMessage("Oops, I have to drop my " + definitions[alsoProducesId].itemName.toLowerCase() + '.', key, worldState);
                    }
                }

                for (var i = 1; i <= resultIndex; i++) {
                    userPriv[items[i].slot] = [];
                }
                if (inputQuantity == quantity) gainXp(skill, experience * (resultIndex + 1), key, worldState);
                if (interaction.consumesTarget && userPriv[targetSlot][0] == targetId && userPriv[sourceSlot][0] == sourceId) {
                    this.ticks = 0;
                    return true
                }

                return false;
            } else {
                userPriv[sourceSlot][1] += inputQuantity;
                if (interaction.consumesTarget) {
                    if (userPriv[targetSlot][0] == targetId) {
                        userPriv[targetSlot][1] += inputQuantity;
                    } else {
                        userPriv[targetSlot] = [targetId, inputQuantity];
                    }
                }
                for (var i = 0; i < removedItems.length; i++) {
                    var item = removedItems[i];
                    if (userPriv[item[0]][0] == item[2]) {
                        userPriv[item[0]][1] += item[1];
                    } else {
                        userPriv[item[0]] = [item[2], item[1]];
                    }
                }
                sendCharacterMessage("I need more inventory space.", key, worldState);
                return false;
            }
        }
        return true;
    }
}