import { sendCharacterMessage, sendCollectionLogMessage } from "../message.js";


export default class CollectionLogAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var log = worldState.serv[key].collection;
        sendCollectionLogMessage(log, key, worldState)
    }
}