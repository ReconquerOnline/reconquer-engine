import { sendNPCMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { addToFirstInventorySlot } from '../utils.js';
import { definitions } from '../loader.js';
import { gainXp } from '../skills.js';

export function overrideBrotherConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q006 == 0) {
        if (interaction == 'Yes.') {
            userPriv.q006 = 1;
            sendCharacterMessage("Yes, I'll help you.", key, worldState);
        } else if (interaction == 'No.') {
            sendCharacterMessage("No, I won't help.", key, worldState);
        } else {
            sendNPCMessage("I'm concerned about wicked spirits infesting our town. Will you help us?", target, key, worldState);
            sendOptionMessage(['Yes.', 'No.'], target, key, worldState);
        }
    }
    if (userPriv.q006 == 1) {
        sendNPCMessage("I've noticed a major increase in imps roaming the town and tormenting everyone.", target, key, worldState);
        sendNPCMessage("See if you can defeat two of them. I think that should help bring the problem under control.", target, key, worldState);
    }
    if (userPriv.q006 == 2) {
        sendNPCMessage("See if you can defeat one more imp.", target, key, worldState);
    }
    if (userPriv.q006 == 3) {
        sendNPCMessage("Great. Now that we have the upper hand, let's really strike at dragon's head.", target, key, worldState);
        sendNPCMessage("Kill the giant goblin who lives deep in the troll dungeon and report back to me.", target, key, worldState);
    }
    if (userPriv.q006 == 4) {
        sendNPCMessage("You've done it! Here is a brass necklace.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['brass_necklace'], 1)) {
            sendInfoTargetMessage("He hands you a brass necklace.", ['brass_necklace', 1], key, worldState);
            sendInfoTargetMessage("Congratulaions! You gained 50 fidelity experience.", 'fidelity.svg', key, worldState);
            gainXp('fidelity', 50, key, worldState);
            userPriv.q006 = 5;
            return true;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }
    if (userPriv.q006 == 5) {
        return false;
    }
    return true;
}

export function ImpDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q006 == 1 || userPriv.q006 == 2) {
        userPriv.q006 += 1;
    }
}

export function GiantGoblinDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q006 == 3) {
        userPriv.q006 = 4;
    }
}

export function overrideImpAggression(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q006 == 5) {
        return true;
    }
    return false;
}