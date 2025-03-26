import { validArgs } from '../inventory.js';

export default class InventoryAction {
    constructor(msg) {
        this.slotA = msg.sa;
        this.slotB = msg.sb;
    }
    static validate(msg) {
        return validArgs[msg.sa] && validArgs[msg.sb];
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];
        var oldSlotA = userPriv[this.slotA];
        userPriv[this.slotA] = userPriv[this.slotB];
        userPriv[this.slotB] = oldSlotA;
    }
}