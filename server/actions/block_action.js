import { sendOptionMessage, sendInfoTargetMessage, sendCharacterMessage, sendBlockMessage } from "../message.js";
import * as WorldState from '../world_state.js';

export default class BlockAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var target = this.target;
        if (!target || !WorldState.isLoggedIn(target) || !worldState.serv[target]) return;
        var name = worldState.pub[target].dn;
        sendBlockMessage(target, key, worldState);
        sendInfoTargetMessage(name + ' has been blocked.', 'exclamation.svg', key, worldState)
    }
}