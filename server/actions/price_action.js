import { validShopArgs } from "../inventory.js";
import { definitions, setAnimation } from "../loader.js";
import { sendNPCMessage } from "../message.js";

export default class PriceAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return validShopArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var priv = worldState.priv[key];

        var shopOwner = worldState.pub[priv.mst];
        if (!shopOwner) {
            setAnimation(user, 'idle');
            return;
        }
        if (!shopOwner[this.target] || !shopOwner[this.target][0]) {
            setAnimation(user, 'idle')
            return;
        }
        var itemId = shopOwner[this.target][0];
        var itemName = definitions[itemId].itemName;

        var price = 1;
        var shopConfig = worldState.priv[priv.mst].shop[this.target];
        if (shopConfig && shopConfig.price !== undefined) {
            price = shopConfig.price;
        } else if (definitions[itemId].price !== undefined) {
            price = definitions[itemId].price;
        }
        var coins = 'coins';
        if (price == 1) coins = 'coin';

        sendNPCMessage('The ' + itemName.toLowerCase() + ' will cost ' + price + ' ' + coins + '.', shopOwner, key, worldState);
        return;
    }
}