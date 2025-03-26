export default class ToggleMacroAction {
    constructor(msg) {
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var user = worldState.pub[key];
        var enable = this.interaction;
        if (enable) {
            user.ma = 1;
        } else {
            user.ma = 0;
        }
    }
}