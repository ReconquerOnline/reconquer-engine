import { validArgs } from "../inventory.js";
import { definitions, setAnimation } from "../loader.js";
import { sendNPCMessage } from "../message.js";

export default class ValueAction {
    constructor(msg) {
        this.target = msg.ta;
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

        if (shopOwner.free) return;

        var itemId = priv[this.target][0];
        var itemName = definitions[itemId].itemName;

        if (definitions[itemId].unsellable) {
            sendNPCMessage("I can't buy your " + itemName.toLowerCase() + ".", shopOwner, key, worldState);
            return;
        }

        var price = 0;
        if (definitions[itemId].price !== undefined) {
            price = Math.floor(definitions[itemId].price / 2);
        }
        var coins = 'coins';
        if (price == 1) coins = 'coin';
        sendNPCMessage('I will pay ' + price + ' ' + coins + ' for your ' + itemName.toLowerCase() + '.', shopOwner, key, worldState);
        return;
    }
}