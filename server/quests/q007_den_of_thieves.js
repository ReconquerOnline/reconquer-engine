import { removeAllItems } from "../action_utils.js";
import { definitions } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage, sendOptionMessage } from "../message.js";
import { loseXp } from "../skills.js";
import { addToFirstInventorySlot, getTotalQuantityOfItemInInventory } from "../utils.js";

// q007 == 5 - gave it back
// q007 == 10 - asked for money

export function overrideVictimConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q007 == 0) {
        if (interaction == "Yes. I'll bring it back.") {
            sendNPCMessage('I think they took it into their den. See if you can sneak it back out.', target, key, worldState);
            userPriv.q007 = 1;
            return;
        } else if (interaction == 'No.') {
            sendCharacterMessage("I'd rather do something else.", key, worldState);
            return;
        } else {
            sendNPCMessage("The thieves stole one of my prized possessions. It was a gift from my grandmother.", target, key, worldState);
            sendNPCMessage("Will you recapture it for me?", target, key, worldState);
            sendOptionMessage(["Yes. I'll bring it back.", 'No.'], target, key, worldState);
            return;
        }
    }

    if (userPriv.q007 == 1) {
        sendNPCMessage('Go explore the den and see if you can bring back what\'s mine.', target, key, worldState);
        return;
    }

    if (userPriv.q007 == 2 && getTotalQuantityOfItemInInventory('candle_holder', userPriv) == 0) {
        sendCharacterMessage("I found a candle stick but lost it on the way.", key, worldState);
        sendNPCMessage('They must still have it. Try again to bring it back.', target, key, worldState);
        return;
    } else if (userPriv.q007 == 2 && getTotalQuantityOfItemInInventory('candle_holder', userPriv) > 0) {
        if (interaction == "Here it is.") {
            userPriv.q007 = 5;
            removeAllItems('candle_holder', userPriv);
            addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)
            addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)
            addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)
            sendNPCMessage("Thank you again for bringing back my candle stick.", target, key, worldState);
            sendInfoTargetMessage("He hands you some food.", ['sorghum_cake_cooked', 1], key, worldState);
            sendNPCMessage("I can cook more for you tomorrow.", target, key, worldState);
            sendInfoTargetMessage("Congratulaions! You completed the quest!", 'combat.svg', key, worldState);
            userPriv.q007t = Date.now() + 21 * 60 * 60 * 1000;
            return;
        } else if (interaction == "You'll need to give me fifty coins for it.") {
            sendNPCMessage("Really? You're extorting me? Fine. Here's your filthy lucre.", target, key, worldState);
            removeAllItems('candle_holder', userPriv);
            if (addToFirstInventorySlot(userPriv, definitions['coins'], 50)) {
                sendInfoTargetMessage("He gives you fifty coins.", ["coins", 50], key, worldState);
                userPriv.q007 = 10;
                sendNPCMessage("Now go away thief!", target, key, worldState);
                loseXp('fidelity', 100, key, worldState);
                sendInfoTargetMessage("Congratulaions! You completed the quest!", 'combat.svg', key, worldState);
                return;
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
            }
        } else {
            sendCharacterMessage("I found your candle stick.", key, worldState);
            sendNPCMessage('Thank you. That is a wonderful thing.', target, key, worldState);
            sendOptionMessage(["Here it is.", "You'll need to give me fifty coins for it."], target, key, worldState);
            return;
        }
    }

    if (userPriv.q007 == 5 && userPriv.q007t < Date.now()) {
        if (addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)) {
            addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)
            addToFirstInventorySlot(userPriv, definitions['sorghum_cake_cooked'], 1)
            sendNPCMessage("Thank you again for bringing back my candle stick.", target, key, worldState);
            sendInfoTargetMessage("He hands you some food.", ['sorghum_cake_cooked', 1], key, worldState);
            sendNPCMessage("I can cook more for you tomorrow.", target, key, worldState);
            userPriv.q007t = Date.now() + 21 * 60 * 60 * 1000;
            return;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return;
        }
    } else if (userPriv.q007 == 5) {
        sendNPCMessage("Thank you again for bringing back my candle stick.", target, key, worldState);
        return;
    }

    if (userPriv.q007 == 10) {
        sendNPCMessage("Go away. You're a thief!", target, key, worldState);
        return;
    }

}

export function overrideChestDenConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q007 == 1 || (userPriv.q007 == 2 && getTotalQuantityOfItemInInventory('candle_holder', userPriv) == 0)) {
        if (addToFirstInventorySlot(userPriv, definitions['candle_holder'], 1)) {
            sendInfoTargetMessage("You find a candle stick.", ["candle_holder", 1], key, worldState);
            userPriv.q007 = 2;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
        }
    } else {
        sendCharacterMessage("I don't see anything in here.", key, worldState);
    }
}