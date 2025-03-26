export default class ToggleHroofAction {
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
            priv.hroof = 1;
        } else {
            priv.hroof = 0;
        }
    }
}