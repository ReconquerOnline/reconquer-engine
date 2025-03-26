import { validBankArgs } from "../inventory.js";
import { definitions, setAnimation } from "../loader.js";
import { addToFirstInventorySlot } from "../utils.js";

export default class WithdrawAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return validBankArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key]
        var priv = worldState.priv[key];

        setAnimation(user, 'idle');

        if (!priv.msb) {
            return;
        }

        var itemId = priv[this.target][0];

        if (!itemId || !definitions[itemId]) return;
        
        var withdrawQuantity = 1;
        if (this.interaction == 'Withdraw 10') {
            withdrawQuantity = 10;
        } else if (this.interaction == 'Withdraw 100') {
            withdrawQuantity = 100;
        } else if (this.interaction == 'Withdraw 1000') {
            withdrawQuantity = 1000;
        } else if (this.interaction == 'Withdraw All') {
            withdrawQuantity = Number.MAX_SAFE_INTEGER;
        }

        var totalPossibleQuantity = priv[this.target][1];
        if (!totalPossibleQuantity) return;
        withdrawQuantity = Math.min(withdrawQuantity, totalPossibleQuantity);

        var amountWithdrawn = addToFirstInventorySlot(priv, definitions[itemId], withdrawQuantity);
        priv[this.target][1] -= amountWithdrawn;
        if (priv[this.target][1] == 0) {
            priv[this.target] = []
        }

        return;
    }
}