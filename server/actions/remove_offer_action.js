import { validTradeArgs } from "../inventory.js";
import { getAction } from "../world_state.js";
import TradePlayerAction from "./trade_player_action.js";

export default class RemoveOfferAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return validTradeArgs[msg.ta];
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];
        if (!pub[this.target] || !pub[this.target][0]) return;

        var targetAction = getAction(priv.mpt);
        if (!targetAction ||
            !(targetAction instanceof TradePlayerAction) ||
            targetAction.target != pub.i) {
            return;
        }
        pub.mps = 0;
        worldState.pub[priv.mpt].mps = 0;

        pub[this.target] = [];
    }
}