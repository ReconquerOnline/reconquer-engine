export default class ToggleHxpAction {
    constructor(msg) {
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var priv = worldState.priv[key];
        var enable = this.interaction;
        if (enable) {
            priv.hxp = 1;
        } else {
            priv.hxp = 0;
        }
    }
}