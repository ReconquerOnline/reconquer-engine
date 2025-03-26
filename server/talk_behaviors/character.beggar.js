import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage, sendOptionMessage } from '../message.js';
import { gainXp } from '../skills.js';
import { getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot } from '../utils.js';

function giveCoins(quantityToGive, target, key, worldState) {
    var userPriv = worldState.priv[key];
    var coinQuantity = getTotalQuantityOfItemInInventory('coins', userPriv);

    if (coinQuantity == 0) {
        sendCharacterMessage("Actually, I don't have any.", key, worldState);
        return;
    }

    if (!quantityToGive) {
        quantityToGive = coinQuantity;
    }
    var numberToGive = Math.min(coinQuantity, quantityToGive);
    if (numberToGive != quantityToGive) {
        sendInfoTargetMessage("You give " + numberToGive + ' coins. ', ['coins', numberToGive], key, worldState);
    }
    removeAmountFromSlot(getItemSlot('coins', userPriv), numberToGive, userPriv);
    gainXp('fidelity', 3 * numberToGive, key, worldState);
    sendNPCMessage('Thank you sir.', target, key, worldState);
}

function giveBread(quantityToGive, target, key, worldState) {
    var userPriv = worldState.priv[key];
    var breadQuantity = getTotalQuantityOfItemInInventory('bread_cooked', userPriv);

    if (breadQuantity == 0) {
        sendCharacterMessage("Actually, I don't have any.", key, worldState);
        return;
    }

    if (!quantityToGive) {
        quantityToGive = breadQuantity;
    }
    var numberToGive = Math.min(breadQuantity, quantityToGive);
    for (var i = 0; i < quantityToGive; i++) {
        removeAmountFromSlot(getItemSlot('bread_cooked', userPriv), 1, userPriv);
    }
    gainXp('fidelity', 10 * numberToGive, key, worldState);
    sendNPCMessage('Thank you sir.', target, key, worldState);
}

export default function handleInteraction(interaction, target, key, worldState) {
    if (interaction == "I have some coins.") {
        sendOptionMessage(["Here's one coin.", "Here's ten coins.", "Here's everything I have.", 'Nevermind.'], target, key, worldState);
    } else if (interaction == 'I have some bread.') {
        sendOptionMessage(["Here's a loaf of bread.", "Here's all my bread.", 'Nevermind.'], target, key, worldState);
    } else if (interaction == "Here's a loaf of bread.") {
        giveBread(1, target, key, worldState);
    } else if (interaction == "Here's all my bread.") {
        giveBread(null, target, key, worldState);
    } else if (interaction == "Here's one coin.") {
        giveCoins(1, target, key, worldState);
    } else if (interaction == "Here's ten coins.") {
        giveCoins(10, target, key, worldState);
    } else if (interaction == "Here's everything I have.") {
        giveCoins(null, target, key, worldState);
    } else if (interaction == 'Nevermind.') {
        sendNPCMessage('Okay then. Have a nice day.', target, key, worldState);
    } else {
        sendNPCMessage("Can you spare anything for me?", target, key, worldState);
        sendOptionMessage(["I have some coins.", 'I have some bread.'], target, key, worldState);
    }
}