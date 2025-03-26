import { definitions } from '../loader.js';
import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage } from '../message.js';
import { addToFirstInventorySlot } from '../utils.js';

export function overrideJesterConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q003 == 0) {
        sendNPCMessage("Riddle me this! I rise without wings", target, key, worldState);
        sendNPCMessage("from fiery breath and simple things.", target, key, worldState);
        sendNPCMessage("Though some may call me the staff of life,", target, key, worldState);
        sendNPCMessage("I hold the power to spark endless strife.", target, key, worldState);
        sendNPCMessage("What am I?", target, key, worldState);
    } else {
        sendNPCMessage("Well done. You're well on your way to being a champion riddler like myself.", target, key, worldState);
    }
}

export function CharacterJesterUseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    if (userPriv.q003 == 0) {
        var firstItem = userPriv[slots[0]][0];
        var definition = definitions[firstItem];
        if (!definition) {
            sendNPCMessage("I am not.", target, key, worldState);
            return;
        }
        var itemName = definition.itemName;
        if (itemName != 'Bread') {
            sendNPCMessage("I am not " + itemName.toLowerCase() + '.', target, key, worldState);
            return;
        }
        
        sendNPCMessage("Yes, congratulations traveler. I am bread. ", target, key, worldState);
        sendNPCMessage("You are a wise man. Here is your reward.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['coins'], 10)) {
            userPriv.q003 = 1;
            sendInfoTargetMessage("He hands you 10 coins.", ['coins', 10], key, worldState)
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
        }
    } else {
        sendNPCMessage("You've already solved my riddle.", target, key, worldState);
    }
}