import { sendNPCMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { addToFirstInventorySlot, getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot} from '../utils.js';
import { definitions } from '../loader.js';

export function overrideFarmerConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q011 == 0) {
        if (interaction == "Sure, I'll help you") {
            sendCharacterMessage("Sure, I'll help you", key, worldState);
            userPriv.q011 = 1;
        } else if (interaction == "No, I have other things to do.") {
            sendNPCMessage("Alright then.", target, key, worldState);
        } else {
            sendNPCMessage("I have a chicken in my coop who's a little bit rowdy. Can you take care of it for me?", target, key, worldState);
            sendOptionMessage(["Sure, I'll help you", "No, I have other things to do."], target, key, worldState);
        }
    }
    
    if (userPriv.q011 == 1) {
        sendNPCMessage("Here is a key to the coop.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions["coop_key"], 1)) {
            sendInfoTargetMessage("He hands you a key.", ["coop_key", 1], key, worldState)
            userPriv.q011 = 2;
        } else {
            sendCharacterMessage("I don't have room in my inventory.", key, worldState)
        }
    }

    if (userPriv.q011 == 2) {
        sendNPCMessage("If you need another key, the chickens sometimes drop them.", target, key, worldState);
        sendNPCMessage("Now go unlock the coop but watch out, she's a handful.", target, key, worldState);
    }

    if (userPriv.q011 == 3) {
        sendNPCMessage("Thank you for taking care of that chicken. Let me give you this.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions["feathers"], 500)) {
            sendInfoTargetMessage("He hands you five hundred feathers", ["feathers", 500], key, worldState)
            userPriv.q011 = 4;
            return;
        } else {
            sendCharacterMessage("I don't have room in my inventory.", key, worldState)
        }
    }

    if (userPriv.q011 == 4) {
        sendNPCMessage("Thanks again for helping me out with my chicken.", target, key, worldState);
    }
   
}

export function ChickenBossDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q011 == 2) {
        userPriv.q011 = 3;
    }
}