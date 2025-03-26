import { resetAccount } from "../database.js";
import { sendOptionMessage, sendInfoTargetMessage, sendCharacterMessage } from "../message.js";
import * as WorldState from '../world_state.js';

export default class ResetAccountAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        sendInfoTargetMessage('Resetting your account will remove all progress and log you out. Are you sure you want to continue?', 'exclamation.svg', key, worldState)
        sendOptionMessage(['Yes, I want to reset my account.', "Nevermind. I'll stick around."], {i: "reset_account"}, key, worldState)
    }
}

export function ResetAccountTalkBehavior(interaction, key, worldState) {
    if (interaction == 'Yes, I want to reset my account.') {
        WorldState.handleLogout(key);
        resetAccount(key);
    } else {
        sendCharacterMessage("Nevermind. I'll stick around.", key, worldState);
    }
}