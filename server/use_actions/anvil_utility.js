import { sendCharacterMessage } from "../message.js";

export default class AnvilUtilityAction {
    constructor(target, items, interaction) {
        this.target = target;
        this.items = items;
        this.ticks = 0;
        this.interaction = interaction;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var userPriv = worldState.priv[key];

        if (!userPriv.iw.includes('hammer')) {
            sendCharacterMessage('I need to be holding a hammer.', key, worldState);
            return false;
        }

        if (!this.itemId) {
            this.itemId = userPriv[this.items[0].slot][0];
        }

        userPriv.msis += 1;
        userPriv.msit = this.target.i + ',' + this.itemId;
        return false;
    }
}