import { sendNPCMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { addToFirstInventorySlot, getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromSlot} from '../utils.js';
import { definitions } from '../loader.js';

export function overrideBakerConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];


    if (interaction == 'Do you know anything about farming?') {
        sendNPCMessage('Yes, in fact I do. First you need to collect some seeds. Then you can plant those seeds in a food plot.', target, key, worldState);
        sendNPCMessage("In order for them to start growing, you'll need to water them using a bucket of water. The more often you water them, the more likely they'll survive.", target, key, worldState);
        sendNPCMessage("Also, be sure to pull the weeds when they sprout up.", target, key, worldState);
        sendNPCMessage("You can also fertilize them to get a bigger yield. I know milk works well.", target, key, worldState);
        sendNPCMessage("Once it grows, be sure to harvest your plants quickly before they disappear.", target, key, worldState);
        sendCharacterMessage('Thanks. That helps a lot.', key, worldState);
        return;
    }

    if (userPriv.q001 == 0) {
        if (interaction == 'Will you teach me to bake bread?') {
            sendNPCMessage('Sure, first you need to find some wheat. I know there is some planted around these parts.', target, key, worldState);
            sendNPCMessage('You can also try growing some in a food plot. Then you thresh it into seeds using your hands.', target, key, worldState);
            sendNPCMessage("Then you'll need to grind it into flour. You'll need a mortar and pestle and then a bucket to hold it.", target, key, worldState)
            sendNPCMessage('Here is a bucket you can use.', target, key, worldState);
            if (addToFirstInventorySlot(userPriv, definitions['bucket'], 1)) {
                userPriv.q001 = 1;
                sendInfoTargetMessage("He hands you a bucket.", ['bucket', 1], key, worldState)
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
                return;
            }
            sendNPCMessage('Finally use the flour on a water source to make bread dough and cook it on a range or fire.', target, key, worldState);
            sendNPCMessage("If you need more buckets, I can sell them to you for five coins.", target, key, worldState);
            sendCharacterMessage('Thank you. Goodbye', key, worldState);
        } else if (interaction == 'Okay, goodbye.') {
            sendNPCMessage("Goodbye.", target, key, worldState);
        } else {
            sendNPCMessage("Hi, I'm a baker!", target, key, worldState);
            sendOptionMessage(['Will you teach me to bake bread?', 'Do you know anything about farming?', 'Okay, goodbye.'], target, key, worldState);
        }
    } else if (userPriv.q001 == 1) {
        if (interaction == 'I want to buy a bucket.') {
            sendCharacterMessage('I want to buy a bucket.', key, worldState);
            sendNPCMessage('That will be five coins.', target, key, worldState);
            if (getTotalQuantityOfItemInInventory('coins', userPriv) >= 5) {
                removeAmountFromSlot(getItemSlot('coins', userPriv), 5, userPriv)
                if (addToFirstInventorySlot(userPriv, definitions['bucket'], 1)) {
                    sendInfoTargetMessage("You hand over five coins.", ['coins', 5], key, worldState)
                    sendInfoTargetMessage("He hands you a bucket.", ['bucket', 1], key, worldState)
                } else {
                    addToFirstInventorySlot(userPriv, definitions['coins'], 5);
                    sendCharacterMessage("Oops, I don't have enough space.", key, worldState);    
                }
            } else {
                sendCharacterMessage("Oops, I don't have enough coins.", key, worldState);
            }
        } else if (interaction == 'Tell me how to make bread again.') {
            sendNPCMessage('Sure, first you need to find some wheat. I know there is some planted around these parts.', target, key, worldState);
            sendNPCMessage('You can also try growing some in a food plot. Then you thresh it into seeds using your hands.', target, key, worldState);
            sendNPCMessage("Then you'll need to grind it into flour. You'll need a mortar and pestle and then a bucket to hold it.", target, key, worldState)
            sendNPCMessage('Finally use the flour on a water source to make bread dough and cook it on a range or fire.', target, key, worldState);
        } else {
            sendNPCMessage("Hi, how are you doing?", target, key, worldState);
            sendOptionMessage(['I want to buy a bucket.', 'Tell me how to make bread again.', 'Do you know anything about farming?'], target, key, worldState);
        }
    }
}