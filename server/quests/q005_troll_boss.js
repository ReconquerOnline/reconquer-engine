import { definitions } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage, sendOptionMessage } from "../message.js";
import { loseXp } from "../skills.js";
import { addToFirstInventorySlot, getTotalQuantityOfItemInInventory, removeAmountFromInventory } from "../utils.js";

// 5 - Defeated troll boss
// 11 - poisoned king

export function overrideKingConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q005 == 0) {
        if (interaction == 'Yes I will.') {
            sendNPCMessage('Great. Talk to the goblins in the nearby camp and report back to me.', target, key, worldState);
            userPriv.q005 = 1;
            return;
        } else if (interaction == 'I am not able.') {
            sendNPCMessage("Okay then. I'll have a vassal do it.", target, key, worldState);
            return;
        } else {
            sendNPCMessage("I've heard rumors that the goblins are planning on bringing trolls into my kingdom to destroy our cities.", target, key, worldState);
            sendNPCMessage('Can you investigate this for me?', target, key, worldState);
            sendOptionMessage(['Yes I will.', 'I am not able.'], target, key, worldState);
            return;
        }
    }
    if (userPriv.q005 == 1) {
        sendNPCMessage('Talk to the goblins in the nearby camp to the south and report back to me.', target, key, worldState);
        return;
    }
    if (userPriv.q005 == 2) {
        if (interaction == 'The goblins are trying to poison you.') {
            userPriv.q005 = 3;
            removeAmountFromInventory("poison_vial", 24, userPriv);
            sendNPCMessage('WHAT???', target, key, worldState);
            sendCharacterMessage("Also they seem to be plotting with the trolls.", key, worldState)
            sendNPCMessage("I've had enough! It's time to go on the offensive against the trolls.", target, key, worldState);
            sendNPCMessage("Now go defeat the head troll deep in their lair on the other side of the mountain.", target, key, worldState)
            sendCharacterMessage("Okay, I will do that", key, worldState)
        } else if (interaction == "I don't know.") {
            sendNPCMessage('I hope you can figure it out.', target, key, worldState);
        } else {
            sendNPCMessage('What have you found out?', target, key, worldState);
            sendOptionMessage(['The goblins are trying to poison you.', "I don't know."], target, key, worldState);
        }
        return;
    }
    if (userPriv.q005 == 3) {
        sendNPCMessage("Go defeat the head troll deep in their lair on the other side of the mountain.", target, key, worldState);
        return;
    }
    if (userPriv.q005 == 4) {
        sendNPCMessage("You've done it! This will keep the trolls at bay for a long time.", target, key, worldState);
        sendNPCMessage("In honor of your victory, I'm going to give you access to my armoury.", target, key, worldState);
        userPriv.q005 = 5;
    }
    if (userPriv.q005 == 5 && userPriv.q005t < Date.now()) {
        if (addToFirstInventorySlot(userPriv, definitions['copper_arrows'], 20)) {
            sendInfoTargetMessage("He hands you twenty copper arrows.", ['copper_arrows', 20], key, worldState);
            sendNPCMessage("Thank you again for fighting the trolls.", target, key, worldState);
            sendNPCMessage("Come back tomorrow for more arrows.", target, key, worldState);
            userPriv.q005t = Date.now() + 21 * 60 * 60 * 1000;
            return;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return;
        }
    } else if (userPriv.q005 == 5) {
        sendNPCMessage("Thank you again for fighting the trolls.", target, key, worldState);
        sendNPCMessage("Come back tomorrow for more arrows.", target, key, worldState);
        return;
    }

    if (userPriv.q005 >= 10) {
        sendNPCMessage("I feel sick...", target, key, worldState);
    }
}

export function overrideMudblatConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q005 == 0) {
        sendNPCMessage('I hate them, I hate them, I hate them.', target, key, worldState);
        return;
    }
    if (userPriv.q005 == 1) {
        sendCharacterMessage('What are you up to?', key, worldState);
        sendNPCMessage('You think I would tell you?', target, key, worldState);
        sendNPCMessage('I am NOT plotting against the king or working with the trolls.', target, key, worldState);
        sendCharacterMessage('Who said anything about trolls?', key, worldState);
        sendNPCMessage("I know the way you think.", target, key, worldState)
        sendNPCMessage("Make yourself useful to us and add some of this to the king's grain supply.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['poison_vial'], 1)) {
            sendInfoTargetMessage("He hands you a vial", ["poison_vial", 1], key, worldState);
            userPriv.q005 = 2;
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
        }
        return;
    }
    if (userPriv.q005 == 2) {
        var quantity = getTotalQuantityOfItemInInventory("poison_vial", userPriv);
        if (quantity == 0) {
            sendNPCMessage("Here is another vial.", target, key, worldState);
            if (addToFirstInventorySlot(userPriv, definitions['poison_vial'], 1)) {
                sendInfoTargetMessage("He hands you a vial", ["poison_vial", 1], key, worldState);
                sendNPCMessage("Now go use this on the king's grain supply.", target, key, worldState);
                return;
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
                return;
            }
        } else {
            sendNPCMessage("Now go use that vial on the king's grain supply.", target, key, worldState);
            return;
        }
    }
    if (userPriv.q005 >= 3 && userPriv.q005 < 10) {
        sendNPCMessage("EEEH! Go away!", target, key, worldState);
    }
    if (userPriv.q005 == 10) {
        sendNPCMessage("Really? You did it? You are one of us.", target, key, worldState);
        sendNPCMessage("I'll make sure the goblins know not to attack you anymore.", target, key, worldState);
        userPriv.q005 = 11;
    }
    if (userPriv.q005 == 11) {
        sendNPCMessage("You're an honorary goblin.", target, key, worldState);
    }
}

export function TrollBossDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q005 == 3) {
        userPriv.q005 = 4;
    }
}

export function overrideGrainBagKingConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (interaction == 'Yes I will.' && getTotalQuantityOfItemInInventory('poison_vial', userPriv)) {
        removeAmountFromInventory("poison_vial", 24, userPriv);
        sendCharacterMessage("I did it. I poisoned him.", key, worldState);
        loseXp('fidelity', 1000, key, worldState);
        userPriv.q005 = 10;
    } else {
        sendCharacterMessage("I'll talk to the king.", key, worldState);
    }

}

export function GrainBagKingUseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    if (userPriv.q005 == 2) {
        var firstItem = userPriv[slots[0]][0];
        if (firstItem == 'poison_vial') {
            sendInfoTargetMessage("Are you sure you want to poison the king's food?", target.i, key, worldState);
            sendOptionMessage(['Yes I will.', "I can't do this."], target, key, worldState);
        } else {
            sendCharacterMessage("I'm not going to do that.", key, worldState);
        }
    } else {
        sendCharacterMessage("I'm not going to do that.", key, worldState);
    }
}

export function overrideTrollGoblinAggression(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q005 == 11) {
        return true;
    }
    return false;
}