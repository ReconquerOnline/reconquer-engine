import { definitions } from '../loader.js';
import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage } from '../message.js';
import { addToFirstInventorySlot } from '../utils.js';

export function overrideJesterConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q004 == 0) {
        sendNPCMessage("Riddle me this! I have a handle, no door.", target, key, worldState);
        sendNPCMessage("A head of metal, meant to roar.", target, key, worldState);
        sendNPCMessage("I speak with a thump, not a word", target, key, worldState);
        sendNPCMessage("And arguments are best unheard.", target, key, worldState);
        sendNPCMessage("What am I?", target, key, worldState);
    } else {
        sendNPCMessage("Well done young riddler.", target, key, worldState);
    }
}

export function CharacterJester2UseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    if (userPriv.q004 == 0) {
        var firstItem = userPriv[slots[0]][0];
        var definition = definitions[firstItem];
        if (!definition) {
            sendNPCMessage("I am not.", target, key, worldState);
            return;
        }
        var itemName = definition.itemName;
        if (!firstItem.includes('mace')) {
            sendNPCMessage("I am not " + itemName.toLowerCase() + '.', target, key, worldState);
            return;
        }
        
        sendNPCMessage("Yes, congratulations traveler. I am a mace. ", target, key, worldState);
        sendNPCMessage("You are a wise man. Here is your reward.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['brass_arrows'], 25)) {
            userPriv.q004 = 1;
            sendInfoTargetMessage("He hands you 25 brass arrows.", ['brass_arrows', 25], key, worldState)
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
        }
    } else {
        sendNPCMessage("You've already solved my riddle.", target, key, worldState);
    }
}