import ConfigOptions from "../config_options.js";
import { sendCharacterMessage } from "../message.js";

export default class MessageAction {
    constructor(msg) {
        this.message = msg.m;
    }
    static validate(msg) {
        return msg.m &&
            typeof msg.m == 'string' &&
            msg.m.length > 0 &&
            msg.m.length <= 40;
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];
        var userServ = worldState.serv[key];
        if (!userPriv.chat) {
            sendCharacterMessage("I need to enable chat to talk to other players.", key, worldState);
            return;
        }
        if (userServ.muted) {
            return;
        }

        // save last ten messages in serv
        userServ.messages.push(this.message);
        if (userServ.messages.length > 10) {
            userServ.messages.shift();
        }

        worldState.pub[key].m = this.message;
        worldState.serv[key].mt = 8;
    }
}