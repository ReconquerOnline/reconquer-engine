export default class ToggleGraphicsAction {
    constructor(msg) {
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];
        if (this.interaction == 1) {
            userPriv.graphics = 1;
        } else if (this.interaction == 2) {
            userPriv.graphics = 2;
        } else if (this.interaction == 3) {
            userPriv.graphics = 3;
        } else if (this.interaction == 4) {
            userPriv.graphics = 4;
        } else if (this.interaction == 5) {
            userPriv.graphics = 5;
        } else {
            userPriv.graphics = 6;
        } 
    }
}