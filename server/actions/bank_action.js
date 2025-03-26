import { validBankArgs } from "../inventory.js";

export default class BankAction {
    constructor(msg) {
        this.slotA = msg.sa;
        this.slotB = msg.sb;
    }
    static validate(msg) {
        return validBankArgs[msg.sa] && validBankArgs[msg.sb];
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];

        if (!userPriv.msb) {
            return;
        }

        var oldSlotA = userPriv[this.slotA];
        userPriv[this.slotA] = userPriv[this.slotB];
        userPriv[this.slotB] = oldSlotA;
    }
}