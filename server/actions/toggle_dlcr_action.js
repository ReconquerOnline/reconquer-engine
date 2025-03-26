export default class ToggleDLCRAction {
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
            userPriv.dlcr = 1;
        } else {
            userPriv.dlcr = 0;
        }
    }
}