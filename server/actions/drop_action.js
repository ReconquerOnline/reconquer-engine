import { validArgs } from '../inventory.js';
import { dropItem, removeAllItems } from '../action_utils.js';
import { definitions } from '../loader.js';

export default class DropAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleImmediate(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        if (userPriv[this.target][0] === undefined) return;

        var itemId = userPriv[this.target];

        var definition = definitions[itemId[0]];
        var despawnConfig = (definition && definition.despawnConfig) ? definition.despawnConfig : { despawnTime: 180 };

        dropItem(itemId[0], itemId[1], {
            lsx: user.lsx,
            lsy: user.lsy,
            lx: user.lx,
            ly: user.ly,
            lf: user.lf,
            li: user.li,
            lr: 0,
        }, worldState, null, despawnConfig);
        userPriv[this.target] = [];
        if (this.interaction == 'Drop All') {
            removeAllItems(itemId[0], userPriv);
        }
    }
}