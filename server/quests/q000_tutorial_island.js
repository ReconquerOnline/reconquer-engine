import { sendNPCMessage, sendInfoMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { definitions, setAnimation } from '../loader.js';
import { addToFirstInventorySlot, generateUUID, getTotalQuantityOfItemInInventory, matchesLocation } from '../utils.js';
import { moveAndRotateTowardsTargetIgnoreFinalWallCollision, transportToPoint } from '../action_utils.js';
import { getItemSlot, removeAmountFromSlot } from "../utils.js";
import { gainXp, getXp, loseXp } from '../skills.js';
import * as WorldState from '../world_state.js';

/*
Quest states
0: initial state
1: received gift from friend
2: learned about goblin boss
3: learned that you can steal the sail
10: stole the sail
11: built the boat after stealing the sail
20: defeated the goblin boss
21`: built the boat after killing goblin
*/

export function overrideFriendConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    // Receive initial gift
    if (userPriv.q000 == 0) {
        sendNPCMessage('Hi ' + worldState.pub[key].dn.split(' ')[0]  + ', good to see you!', target, key, worldState);
        sendNPCMessage('Here is a gift to get you started.', target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['coins'], 5)) {
            userPriv.q000 = 1;
            sendInfoTargetMessage("He hands you five coins.", ['coins', 5], key, worldState)
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }

    // Agree to help him with quest
    if (getXp('fishing', key, worldState) == 0) {
        sendNPCMessage("I'm going to teach you the way of the world.", target, key, worldState); 
        sendNPCMessage("First, you'll need food in order to restore your health.", target, key, worldState);
        sendNPCMessage('Go see if you can dig up some shrimp on the beach.', target, key, worldState);
        sendNPCMessage('Some fishing spots are better than others so try a few.', target, key, worldState);
        return true;
    }
    if (getXp('cooking', key, worldState) == 0) {
        sendNPCMessage("In order to eat the shrimp, you'll need to cook it first.", target, key, worldState); 
        sendNPCMessage("Use your shrimp on the fire back there and try not to burn it.", target, key, worldState);
        sendNPCMessage("You'll get better at cooking over time.", target, key, worldState);
        return true;
    }

    if (userPriv.q000 == 1) {
        sendNPCMessage("Nice job cooking the shrimp, but you'll also need some other skills.", target, key, worldState); 
        sendNPCMessage("Here is a pickaxe.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_pickaxe'], 1)) {
            userPriv.q000 = 2;
            sendInfoTargetMessage("He hands you a copper pickaxe.", ['copper_pickaxe', 1], key, worldState)
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }
    if (getXp('mining', key, worldState) == 0) {
        sendNPCMessage("Go over to that copper rock and see if you can mine anything.", target, key, worldState);
        sendNPCMessage("Watch out for the crabs though. They're weak against crush weapons like the pickaxe.", target, key, worldState);
        return true;
    }

    if (userPriv.q000 == 2) {
        sendNPCMessage("Now you'll need to turn your ore into a bar. Here, wear these gloves.", target, key, worldState); 
        if (addToFirstInventorySlot(userPriv, definitions['leather_gloves'], 1)) {
            userPriv.q000 = 3;
            sendInfoTargetMessage("He hands you leather gloves.", ['leather_gloves', 1], key, worldState);
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }
    if (getXp('smithing', key, worldState) == 0) {
        sendNPCMessage("Now use your ore on the furnace inside.", target, key, worldState); 
        return true;
    }

    if (userPriv.q000 == 3) {
        sendNPCMessage("Here is a hammer. Now you can make something on the anvil.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_hammer'], 1)) {
            userPriv.q000 = 4;
            sendInfoTargetMessage("He hands you a copper hammer.", ['copper_hammer', 1], key, worldState);
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }

    if (userPriv.q000 == 4) {
        sendNPCMessage("Also here is a copper ingot. It should be enough to make a knife.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_ingot_large'], 1)) {
            userPriv.q000 = 5;
            sendInfoTargetMessage("He hands you a copper ingot.", ['copper_ingot_large', 1], key, worldState);
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }

    // if not knife in inventory
    if (getTotalQuantityOfItemInInventory('copper_knife', userPriv) == 0 && userPriv.iw != 'copper_knife') {
        sendNPCMessage("You can use knives for carving up wood and making things out of leather.", target, key, worldState);
        sendNPCMessage("See if you can make one on the anvil or buy one from the smith.", target, key, worldState);
        return true;
    }

    if (userPriv.q000 == 5) {
        sendNPCMessage("I have one last thing to teach you. Here is a hatchet.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions['copper_hatchet'], 1)) {
            userPriv.q000 = 6;
            sendInfoTargetMessage("He hands you a copper hatchet.", ['copper_hatchet', 1], key, worldState);
        } else {
            sendCharacterMessage('My inventory is full.', key, worldState);
            return true;
        }
    }

    if (getXp('forestry', key, worldState) == 0) {
        sendNPCMessage("See if you can chop down a tree.", target, key, worldState);
        sendNPCMessage("Wood can be used for building things, crafting items with a knife, or making fires.", target, key, worldState);
        return true;
    }

    if (userPriv.q000 == 6 || userPriv.q000 == 7) {
        sendNPCMessage("You're ready. Now it's time to fight the goblin king and bring back his head.", target, key, worldState);
        sendNPCMessage("If you can do that, I will give you a sail and teach you to build a boat so you can sail away.", target, key, worldState);
        sendNPCMessage("He lives at the top of this mountain.", target, key, worldState);
        sendNPCMessage("Bring some extra food and you should be able to defeat him. Just watch out for falling boulders.", target, key, worldState);
        return true;
    }


    // you stole his sail
    if (userPriv.q000 == 10 || userPriv.q000 == 11) {
        sendNPCMessage('Did you steal my sail? I don\'t want to talk to you.', target, key, worldState);
        return true;
    }

    // if you defeated the goblin and don't have a sail
    if (userPriv.q000 == 20) {
        if (getTotalQuantityOfItemInInventory('sail', userPriv) == 0) {
            sendCharacterMessage('I defeated the goblin!', key, worldState);
            sendNPCMessage('You did! Hand me the head.', target, key, worldState);
            if (getTotalQuantityOfItemInInventory('goblin_head', userPriv) > 0) {
                removeAmountFromSlot(getItemSlot('goblin_head', userPriv), 1, userPriv);
                sendInfoTargetMessage("You hand over the head", ['goblin_head', 1], key, worldState);
                addToFirstInventorySlot(userPriv, definitions['sail'], 1);
                sendNPCMessage('Here is my sail.', target, key, worldState);
            } else {
                sendCharacterMessage('I must\'ve lost it. I\'ll get it again.', key, worldState);
            }
        }
        if (getTotalQuantityOfItemInInventory('sail', userPriv) > 0) {
            sendNPCMessage('Now go over to the dock and build the boat. You\'ll need a hammer, fifteen nails, five logs, and the sail.', target, key, worldState);
            sendNPCMessage('You can make some nails by smelting copper ore and using it on the anvil.', target, key, worldState);
            sendNPCMessage('You can always buy another hammer from the smith.', target, key, worldState);
            sendNPCMessage('If you lost your gloves, you can make them from leather, thread, and a knife.', target, key, worldState);
            sendNPCMessage('You can get another hatchet from the smith and use that to get the wood you need.', target, key, worldState);
        }
        return true;
    }

    sendCharacterMessage('Hi, friend! Thank you for defeating goblin.', key, worldState);
    sendNPCMessage('Thank you for all the lessons.', target, key, worldState);
}

// Find out that stealing from your friend is an option
export function overrideWarowitzConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q000 == 6 || userPriv.q000 == 7) {
        sendCharacterMessage('I\'m here to defeat your leader.', key, worldState);
        sendNPCMessage('Oh no! Don\'t do that!', target, key, worldState);
        sendCharacterMessage('My friend promised me his sail if I brought back his head.', key, worldState);
        sendNPCMessage('You don\'t need to do that. You can steal the sail from your friend.', target, key, worldState);
        sendNPCMessage('He keeps it in a chest in the upstairs of his house.', target, key, worldState);
        sendNPCMessage('I would never mislead you.', target, key, worldState);
        userPriv.q000 = 7;
        return true;
    }
    if (userPriv.q000 == 10) {
        if (interaction == 'Hammer') {
            sendNPCMessage('You\'ll need to buy it from the smith.', target, key, worldState);
            sendOptionMessage(['Hammer', 'Nails', 'Logs', 'I\'m leaving'], target, key, worldState);
        } else if (interaction == 'Nails') {
            sendNPCMessage('Make it out of copper ingots.', target, key, worldState);
            sendOptionMessage(['Hammer', 'Nails', 'Logs', 'I\'m leaving'], target, key, worldState);
        } else if (interaction == 'Logs') {
            sendNPCMessage('You need to buy or make an ax, then cut down five trees.', target, key, worldState);
            sendOptionMessage(['Hammer', 'Nails', 'Logs', 'I\'m leaving'], target, key, worldState);
        } else if (interaction == 'I\'m leaving') {
            sendCharacterMessage('Get away from me.', key, worldState);
        } else {
            sendCharacterMessage('I stole his sail.', key, worldState);
            sendNPCMessage('You did? Really? Great!', target, key, worldState);
            sendNPCMessage('Now you can build the sail boat. You\'ll need three more items. A hammer, fifteen nails, and five logs', target, key, worldState);
            sendNPCMessage('Do you want to know how to get any of these?', target, key, worldState);
            sendOptionMessage(['Hammer', 'Nails', 'Logs', 'I\'m leaving'], target, key, worldState);
        }
        return true;

    }
    return false;
}

// Steal from friend
export function overrideChestConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q000 == 7 || userPriv.q000 == 10) {
        if (interaction == 'Yes, I will steal from him') {
            if (addToFirstInventorySlot(userPriv, definitions['sail'], 1)) {
                sendInfoTargetMessage("You steal the sail.", ["sail", 1], key, worldState);
                loseXp('fidelity', 100, key, worldState);
                userPriv.q000 = 10;
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
            }
        } else if (interaction == 'No, I better not. He\'s my friend.') {
            sendCharacterMessage('I\'ll get it some different way.', key, worldState);
        } else {
            sendInfoTargetMessage("Are you sure you want to steal from your friend's chest?", target.i, key, worldState);
            sendOptionMessage(['Yes, I will steal from him', 'No, I better not. He\'s my friend.'], target, key, worldState);
        }
    } else {
        sendInfoTargetMessage("Hmmm. I wonder what is in here...", target.i, key, worldState);
    }
}

export class DockBuildAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target || user.lf != target.lf || user.li != target.li || targetPriv.id != 'dock.500-500') {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (userPriv.q000 != 10 && userPriv.q000 != 20) {
            setAnimation(user, 'idle');
            sendCharacterMessage("I don't know how to do this.", key, worldState);
            return false;
        }

        if (!userPriv.iw.includes('hammer')) {
            setAnimation(user, 'idle');
            sendCharacterMessage('I need to be holding a hammer.', key, worldState);
            return false;
        }

        setAnimation(user, 'hammer');
        this.tick += 1;
        if (this.tick == 6) {
            setAnimation(user, 'idle');
            var sailQuantity = getTotalQuantityOfItemInInventory('sail', userPriv);
            var pineWoodQuantity = getTotalQuantityOfItemInInventory('pine_wood', userPriv);
            var nailsQuantity = getTotalQuantityOfItemInInventory('copper_nails', userPriv);
            if (sailQuantity < 1 || pineWoodQuantity < 5 || nailsQuantity < 15) {
                sendCharacterMessage('I need a sail, five logs, and fifteen nails.', key, worldState);
                return false;
            }
            removeAmountFromSlot(getItemSlot('sail', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('copper_nails', userPriv), 15, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            gainXp('crafting', 10, key, worldState);

            userPriv["dock.500-500.ss"] = 1;
            userPriv["dock.500-500.si"] = 1;
            if (userPriv.q000 == 10) {
                userPriv.q000 = 11;
            } else {
                userPriv.q000 = 21;
            }
            return false;
        }

        return true;
    }
}

export class DockSailAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target || user.lf != target.lf || user.li != target.li || targetPriv.id != 'dock.500-500') {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (userPriv.q000 !== 11 && userPriv.q000 !== 21) {
            sendCharacterMessage("I don't know how to do this.", key, worldState);
            return false;
        }

        transportToPoint(user, {
            lsx: 486,
            lsy: 510,
            lx: 59,
            ly: 58,
            lr: 1,
            lf: 0,
            li: 0
        }, worldState); 
        setAnimation(user, 'idle');
        return false;
    }
}

export function GoblinBossDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q000 == 6 || userPriv.q000 == 7) {
        userPriv.q000 = 20;
    }
}