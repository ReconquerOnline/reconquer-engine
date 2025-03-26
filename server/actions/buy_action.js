import { validShopArgs } from "../inventory.js";
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendNPCMessage } from "../message.js";
import { addToFirstInventorySlot, canAddToInventory, getItemSlot, removeAmountFromSlot, sqrtDistanceBetween } from "../utils.js";

export default class BuyAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return validShopArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var priv = worldState.priv[key];

        var shopOwner = worldState.pub[priv.mst];
        if (!shopOwner || !shopOwner[this.target] || !shopOwner[this.target][0] || worldState.priv[priv.mst].id.startsWith('chest_resource')) {
            setAnimation(user, 'idle')
            return;
        };

        var distanceAway = sqrtDistanceBetween(shopOwner, worldState.pub[key]);
        if (distanceAway > 5 || (shopOwner.free && distanceAway > 1.5)) {
            sendCharacterMessage("I'm too far away.", key, worldState);
            setAnimation(user, 'idle')
            return;
        }

        var itemId = shopOwner[this.target][0];

        var price = 1;
        var shopConfig = worldState.priv[priv.mst].shop[this.target];
        if (shopConfig && shopConfig.price !== undefined) {
            price = shopConfig.price;
        } else if (definitions[itemId].price !== undefined) {
            price = definitions[itemId].price;
        }
        var purchaseQuantity = 1;
        if (this.interaction == 'Buy 10') {
            purchaseQuantity = 10;
        } else if (this.interaction == 'Buy 100') {
            purchaseQuantity = 100;
        } else if (this.interaction == 'Withdraw All') {
            purchaseQuantity = 999999999;
        }

        if (shopOwner.free) {
            price = 0;
        }

        var coinSlot = getItemSlot('coins', priv);
        if (price > 0 && (!coinSlot || priv[coinSlot][1] < price)) {
            sendNPCMessage("You don't have enough coins.", shopOwner, key, worldState);
            setAnimation(user, 'idle')
            return;
        };
        var purchased = 0;
        while (purchased < purchaseQuantity && (price == 0 || (coinSlot && priv[coinSlot][1] >= price)) && shopOwner[this.target][1] > 0) {
            if (canAddToInventory(priv, definitions[itemId]) || (coinSlot && price == priv[coinSlot][1])) {
                if(coinSlot) removeAmountFromSlot(coinSlot, price, priv);
                addToFirstInventorySlot(priv, definitions[itemId], 1);
                purchased += 1;
                shopOwner[this.target][1] -= 1;
                if (shopOwner[this.target][1] == 0 && (!shopConfig || !shopConfig.itemId)) {
                    shopOwner[this.target] = [];
                }
            } else {
                if (purchased == 0) {
                    sendNPCMessage("You don't have any space for that.", shopOwner, key, worldState);
                }
                break;
            }
        }
        setAnimation(user, 'idle')
        return;
    }
}