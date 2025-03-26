export default class ToggleChatAction {
    constructor(msg) {
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];
        var enable = this.interaction;
        if (enable) {
            userPriv.chat = 1;
        } else {
            userPriv.chat = 0;
        }
    }
}