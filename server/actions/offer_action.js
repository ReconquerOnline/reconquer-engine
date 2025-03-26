import { validArgs } from "../inventory.js";
import { definitions } from "../loader.js";
import { sendCharacterMessage } from "../message.js";
import { addToFirstTradeSlot, getTotalQuantityOfItemInInventory, getTotalQuantityOfItemInTrade } from "../utils.js";
import { getAction } from "../world_state.js";
import TradePlayerAction from "./trade_player_action.js";

export default class OfferAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];
        if (!priv[this.target] || !priv[this.target][0]) return;

        var targetAction = getAction(priv.mpt);
        if (!targetAction ||
            !(targetAction instanceof TradePlayerAction) ||
            targetAction.target != pub.i) {
            return;
        }
        pub.mps = 0;
        worldState.pub[priv.mpt].mps = 0;

        var itemId = priv[this.target][0];

        var offerQuantity = 1;
        if (this.interaction == 'Offer 10') {
            offerQuantity = 10;
        } else if (this.interaction == 'Offer 100') {
            offerQuantity = 100;
        } else if (this.interaction == 'Offer 1000') {
            offerQuantity = 1000;
        } else if (this.interaction == 'Offer 10k') {
            offerQuantity = 10000;
        } else if (this.interaction == 'Offer 100k') {
            offerQuantity = 100000;
        }

        var quantityCurrentlyOffered = getTotalQuantityOfItemInTrade(itemId, pub);
        var totalPossibleQuantity = getTotalQuantityOfItemInInventory(itemId, priv) - quantityCurrentlyOffered;
        var actualQuantity = Math.min(offerQuantity, totalPossibleQuantity);

        if (actualQuantity < 1) return;

        if (!addToFirstTradeSlot(pub, definitions[itemId], actualQuantity)) {
            sendCharacterMessage("I can't offer any more", key, worldState)
        }

        return;
    }
}