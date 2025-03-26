import { adjectives, names } from "../loader.js";
import * as Database from '../database.js';
import { sendInfoTargetMessage } from "../message.js";

function allowAlphaNumericAndSpaces(input) {
    var regex = /^[a-zA-Z0-9 ]*$/;
    return regex.test(input);
}
function isValidString(str) {
    if (str.startsWith(" ")) {
        return false;
    }
    if (str.endsWith(" ")) {
        return false;
    }
    const regex = /  +/;
    if (regex.test(str)) {
        return false;
    }
  
    return true;
  }
export default class CustomNameAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
        this.index = msg.i
    }
    static validate(msg) {
        return true
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];

        var newName = this.interaction
        if (newName.length < 4) {
            sendInfoTargetMessage("Name must be at least four characters", 'exclamation.svg', key, worldState);
            return;
        }
        if (newName.length >= 20) {
            sendInfoTargetMessage("Name cannot be longer than 20 characters", 'exclamation.svg', key, worldState);
            return;
        }
        if (!allowAlphaNumericAndSpaces(newName)) {
            sendInfoTargetMessage("Name can only contain alphanumerics and spaces", 'exclamation.svg', key, worldState);
            return;
        }
        if (!isValidString(newName)) {
            sendInfoTargetMessage("Name cannot have multiple spaces in a row or start or end with a space.", 'exclamation.svg', key, worldState);
            return;
        }

        Database.isUniqueDisplayName(newName).then((isUnique) => {
            if (isUnique) {
                Database.addNameChange(key, newName);
                sendInfoTargetMessage("Your name change request was received.", 'logo.svg', key, worldState);
            } else {
                sendInfoTargetMessage("Name is already taken.", 'exclamation.svg', key, worldState);
            }
        }).catch(err => {
            sendInfoTargetMessage("Could not request name.", 'exclamation.svg', key, worldState);
        });
    }
}