import { sendCharacterMessage } from "../message.js";


export default class TimePlayedAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var ticksPlayed = worldState.serv[key].tc;
        var seconds = Math.ceil(ticksPlayed * .6);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(seconds / 60 / 60);
        minutes = minutes - hours * 60;
        seconds = seconds - minutes * 60 - hours * 3600;

        var messageString = "I've been here for " + hours + ' hour';
        if (hours != 1) {
            messageString += 's';
        }
        messageString += ', ' + minutes + ' minute';
        if (minutes != 1) { 
            messageString += 's';
        }
        messageString += ' and ' + seconds + ' second'
        if (seconds != 1) { 
            messageString += 's';
        }
        messageString += '.';
        sendCharacterMessage(messageString, key, worldState)
    }
}