import { sendNPCMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { addToFirstInventorySlot } from '../utils.js';
import { definitions } from '../loader.js';

export function overrideHeroConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q002 == 0) {
        if (interaction == 'Yes, I do.') {
            userPriv.q002 = 1;
        } else if (interaction == 'No.') {
            sendCharacterMessage('No. I do not.', key, worldState);
            sendNPCMessage("Hah. I thought so.", target, key, worldState);
        } else {
            sendNPCMessage("Greetings. I am a brave knight.", target, key, worldState);
            sendNPCMessage("Do you excel at bravery and fortitude?", target, key, worldState);
            sendOptionMessage(['Yes, I do.', 'No.'], target, key, worldState);
        }
    }
    if (userPriv.q002 == 1) {
        sendNPCMessage("Prove your skill to me. Destroy five goblins.", target, key, worldState);
        sendNPCMessage("I have a sword for you at your return.", target, key, worldState);
    }
    if (userPriv.q002 == 2) {
        sendNPCMessage("Prove your skill to me. Destroy four more goblins.", target, key, worldState);
        sendNPCMessage("I have a sword for you at your return.", target, key, worldState);
    }
    if (userPriv.q002 == 3) {
        sendNPCMessage("Prove your skill to me. Destroy three more goblins.", target, key, worldState);
        sendNPCMessage("I have a sword for you at your return.", target, key, worldState);
    }
    if (userPriv.q002 == 4) {
        sendNPCMessage("Prove your skill to me. Destroy two more goblins.", target, key, worldState);
        sendNPCMessage("I have a sword for you at your return.", target, key, worldState);
    }
    if (userPriv.q002 == 5) {
        sendNPCMessage("Prove your skill to me. Destroy one more goblin.", target, key, worldState);
        sendNPCMessage("I have a sword for you at your return.", target, key, worldState);
    }
    if (userPriv.q002 == 6) {
        sendNPCMessage("Congratulations fellow hero. Here is a sword.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_sword'], 1)) {
            userPriv.q002 = 7;
            sendInfoTargetMessage("He hands you a copper sword.", ['copper_sword', 1], key, worldState)
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }
    if (userPriv.q002 == 7) {
        sendNPCMessage('You have one more trial. Defeat a fierce wolf.', target, key, worldState);
        sendNPCMessage('He lives in the distant parts of this realm.', target, key, worldState);
        sendNPCMessage('When you have completed this trial, report back to me.', target, key, worldState);
    }
    if (userPriv.q002 == 8) {
        sendNPCMessage('Incredible! You have proven yourself.', target, key, worldState);
        sendNPCMessage('I present you with this.', target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_necklace'], 1)) {
            userPriv.q002 = 9;
            sendInfoTargetMessage("He hands you a copper necklace.", ['copper_necklace', 1], key, worldState);
            sendNPCMessage('One day, you might even approach me in bravery.', target, key, worldState);
            return true;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }
    if (userPriv.q002 == 9) {
        return false;
    }
    return true;
}

export function GoblinMonsterDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q002 < 6 && userPriv.q002 > 0) {
        userPriv.q002 += 1;
    }
}

export function WolfDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q002 == 7) {
        userPriv.q002 = 8;
    }
}