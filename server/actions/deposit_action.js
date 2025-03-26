import { validArgs } from "../inventory.js";
import { setAnimation } from "../loader.js";
import { sendCharacterMessage } from "../message.js";
import { getTotalQuantityOfItemInInventory, removeAmountFromInventory } from "../utils.js";

function bankCanAcceptItem(itemId, userPriv) {
    for (var i = 0; i < 64; i++){
        if (userPriv['bi' + i][0] === itemId || userPriv['bi' + i].length == 0) {
            return true;
        }
    }
    return false;
}

function addToFirstBankSlot(itemId, quantity, userPriv) {
    for (var i = 0; i < 64; i++){
        if (userPriv['bi' + i][0] === itemId) {
            userPriv['bi' + i][1] += quantity;
            return;
        }
    }
    for (var i = 0; i < 64; i++){
        if (userPriv['bi' + i][0] === undefined) {
            userPriv['bi' + i] = [itemId, quantity];
            return;
        }
    }
}

export default class DepositAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var priv = worldState.priv[key];

        if (priv.msb == 0) {
            setAnimation(user, 'idle')
            return;
        }

        if (!priv[this.target] || !priv[this.target][0] || !priv[this.target][1]) return;

        var itemId = priv[this.target][0];

        var quantity = 1;
        if (this.interaction == 'Deposit 10') {
            quantity = 10;
        } else if (this.interaction == 'Deposit 100') {
            quantity = 100;
        } else if (this.interaction == 'Deposit 1000') {
            quantity = 1000;
        } else if (this.interaction == 'Deposit All') {
            quantity = Number.MAX_SAFE_INTEGER;
        }

        var totalPossibleQuantity = getTotalQuantityOfItemInInventory(itemId, priv);
        quantity = Math.min(quantity, totalPossibleQuantity);

        if (!bankCanAcceptItem(itemId, priv)) {
            sendCharacterMessage("I don't have any room in my bank.", key, worldState);
            setAnimation(user, 'idle')
            return;
        }
        if (quantity == 1) {
            priv[this.target][1] -= quantity;
            if (priv[this.target][1] == 0) {
                priv[this.target] = [];
            }
        } else {
            removeAmountFromInventory(itemId, quantity, priv);
        }
        addToFirstBankSlot(itemId, quantity, priv);
        setAnimation(user, 'idle')
        return;
    }
}