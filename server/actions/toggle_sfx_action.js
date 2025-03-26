export default class ToggleSfxAction {
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
            userPriv.sfx = 1;
        } else {
            userPriv.sfx = 0;
        }
    }
}