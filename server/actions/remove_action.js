import { validEquipmentArgs } from '../inventory.js';
import { addToFirstInventorySlot } from '../utils.js';
import { definitions } from '../loader.js';
import { sendCharacterMessage } from '../message.js';
import { removeItem, updateEquipmentBonuses } from '../action_utils.js';

export default class RemoveAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return validEquipmentArgs[msg.ta];
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];
        if (!priv[this.target]) return;

        var currentItem = priv[this.target];
        var definition = definitions[currentItem];
        if (!definition) return;
        if (addToFirstInventorySlot(priv, definition, 1)) {
            removeItem(this.target, pub, priv);
        } else {
            sendCharacterMessage('I don\'t have the inventory space.', key, worldState);
        }
        updateEquipmentBonuses(priv);
    }
}