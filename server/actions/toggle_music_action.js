export default class ToggleMusicAction {
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
            userPriv.music = 1;
        } else {
            userPriv.music = 0;
        }
    }
}