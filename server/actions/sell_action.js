import { validArgs } from "../inventory.js";
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendNPCMessage } from "../message.js";
import { addToFirstInventorySlot, addToFirstShopSlot, distanceBetween, getTotalQuantityOfItemInInventory, removeAmountFromInventory, removeAmountFromSlot, shopCanAcceptItem } from "../utils.js";

export default class SellAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var priv = worldState.priv[key];

        setAnimation(user, 'idle')

        if (!priv[this.target] || !priv[this.target][0]) return;

        var shopOwner = worldState.pub[priv.mst];
        if (!shopOwner) return;

        if (distanceBetween(shopOwner, worldState.pub[key]) > 5) {
            sendCharacterMessage("I'm too far away.", key, worldState);
            return;
        }

        var itemId = priv[this.target][0];
        var itemName = definitions[itemId].itemName;

        if (definitions[itemId].unsellable && !shopOwner.free) {
            sendNPCMessage("I can't buy your " + itemName.toLowerCase() + ".", shopOwner, key, worldState);
            return;
        }

        var price = 0;
        if (definitions[itemId].price !== undefined) {
            price = Math.floor(definitions[itemId].price / 2);
        }
        var sellQuantity = 1;
        if (this.interaction == 'Sell 10') {
            sellQuantity = 10;
        } else if (this.interaction == 'Sell 100') {
            sellQuantity = 100;
        } else if (this.interaction == 'Deposit All') {
            sellQuantity = 999999999;
        }

        if (shopOwner.free) {
            price = 0;
        }

        var totalPossibleQuantity = getTotalQuantityOfItemInInventory(priv[this.target][0], priv);   
        sellQuantity = Math.min(sellQuantity, totalPossibleQuantity);

        var sellValue = sellQuantity * price;

        // make sure shop can accept item and user can accept coins
        if (!shopCanAcceptItem(shopOwner, itemId)) {
            sendNPCMessage("There is no room here.", shopOwner, key, worldState);
            return;
        }
        if (price == 0 || addToFirstInventorySlot(priv, definitions['coins'], sellValue)) {
            removeAmountFromInventory(itemId, sellQuantity, priv)
            addToFirstShopSlot(shopOwner, itemId, sellQuantity);
        } else {
            sendCharacterMessage("I don't have any room.", key, worldState);
        }
        return;
    }
}