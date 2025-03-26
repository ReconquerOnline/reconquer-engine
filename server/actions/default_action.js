import { definitions, setAnimation } from "../loader.js";
import { addToFirstInventorySlot, getMatch, getMatchMap, canAddToInventory, removeAmountFromSlot, getTotalQuantityOfItemInInventory } from "../utils.js";
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import ConfigOptions from "../config_options.js";

var defaultMap = getMatchMap(definitions, 'defaultMap');

var defaultInteractions = {};
for (var key in definitions) {
    var definition = definitions[key];
    if (!definition) continue;
    if (!definition.inventoryInteractions) continue;
    defaultInteractions[key] = definition.inventoryInteractions.filter(x => x.type == 'default')[0];
}

export default class DefaultAction {
    constructor(msg) {
        this.target = msg.ta;
        this.ticks = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        var slot = this.target;
        if (!this.itemId) {
            this.itemId = userPriv[slot][0];
        }
        var itemQuantity = userPriv[slot];
        if (!itemQuantity[0] || itemQuantity[0] != this.itemId) {
            setAnimation(user, 'idle');
            return;
        }

        var interaction = defaultInteractions[this.itemId];
        if (!interaction) {
            setAnimation(user, 'idle');
            return;
        }

        setAnimation(user, interaction.animation);
        this.ticks += 1;
        if (this.ticks == interaction.ticks) {
            setAnimation(user, 'idle');

            var minimumLevel = interaction.level ? interaction.level : 1;
            var experience = interaction.experience ? interaction.experience : 0;
            var skill = interaction.skill ? interaction.skill : 'crafting';
            var level = getLevel(skill, key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' ' + skill + '.', skill + '.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var sourceQuantity = userPriv[slot][1];
            var requiredQuantity = interaction.inputQuantity ? interaction.inputQuantity : 1;

            if (sourceQuantity < requiredQuantity) {
                sendCharacterMessage("I need at least " + requiredQuantity + ' ' + this.itemId + '.', key, worldState);
                return false;
            }

            var result = getMatch(null, null, defaultMap[this.itemId]);
            removeAmountFromSlot(slot, requiredQuantity, userPriv);
            if (result) {
                if (canAddToInventory(userPriv, definitions[result[0]], result[1])) {
                    if ((definitions[result[0]].stackable &&
                        getTotalQuantityOfItemInInventory(result[0], userPriv) > 0) || userPriv[slot][1]) {
                        addToFirstInventorySlot(userPriv, definitions[result[0]], result[1]);
                    } else {
                        userPriv[slot] = [result[0], result[1]];
                    }
                    gainXp(skill, experience, key, worldState)
                } else {
                    userPriv[slot][0] = this.itemId;
                    userPriv[slot][1] = (!userPriv[slot][1] || userPriv[slot][1] == 0) ? requiredQuantity : userPriv[slot][1] + requiredQuantity;
                    sendCharacterMessage('I need more room in my inventory', key, worldState);
                }
            }
            return false;
        }
        return true;
    }
}