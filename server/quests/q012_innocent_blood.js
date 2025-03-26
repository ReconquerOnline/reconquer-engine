import { sendNPCMessage, sendInfoMessage, sendInfoTargetMessage, sendOptionMessage, sendCharacterMessage } from '../message.js';
import { definitions, setAnimation } from '../loader.js';
import { addToFirstInventorySlot, generateUUID, getNearbyCharacters, getTotalQuantityOfItemInInventory, matchesLocation } from '../utils.js';
import { moveAndRotateTowardsTargetIgnoreFinalWallCollision, transportToPoint } from '../action_utils.js';
import { getItemSlot, removeAmountFromSlot } from "../utils.js";
import { gainXp, getXp, loseXp } from '../skills.js';
import * as WorldState from '../world_state.js';

// Quest States
// 0 not started
// 1 agree to help
// 2 talk to Knight
// 3 defeat pydar
//   talk to knight again
// 4 talk to brother
// 5 defeat water goblin
//   talk to brother again
// 6 talk to Hero
// 7 defeat spider
//   talk to hero again
// 8 talk to sage with items, allowed to start raid
//   finish wave 1
//   finish wave 2
//   finish wave 3
// 9 defeat dragon
// 10 receive nickelbronze necklace

export function overrideSageConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    // Receive initial gift
    if (userPriv.q012 == 0) {

        if (interaction == "Yes, I’ll help you.") {
            userPriv.q012 = 1;
            sendNPCMessage("Good. But this battle will take preparation and I don’t have all the answers.", target, key, worldState);
            sendNPCMessage("Seek the three bravest warriors in this realm and learn from them.", target, key, worldState);
        } else if (interaction == "No, I have other things to do.") {
            sendNPCMessage("I guess we'll be eaten by the wolves.", target, key, worldState);
            sendInfoTargetMessage("You lose 10 fidelity experience.", "fidelity.svg", key, worldState);
            loseXp('fidelity', 10, key, worldState);
        } else {
            sendNPCMessage('Do you know anything at all?', target, key, worldState);
            sendCharacterMessage('I think I do.', key, worldState);
            sendNPCMessage("You don't.", target, key, worldState);
            sendCharacterMessage("I don't?", key, worldState);
            sendNPCMessage("No. We’re both slaves, ruled by masters who dwell here. This is where the guilt for all innocent blood spilled on earth lies.", target, key, worldState);
            sendNPCMessage("Will you fight with me? I can’t do this alone.", target, key, worldState);
    
            sendOptionMessage(["Yes, I’ll help you.", "No, I have other things to do."], target, key, worldState);
        }
    }
    if (userPriv.q012 >= 1 && userPriv.q012 < 4) {
        sendNPCMessage("I can’t linger here. Speak to the brave Bronze Knight. He’ll guide you.", target, key, worldState);
    } else if (userPriv.q012 == 4) {
        sendCharacterMessage("I've learned what I could from the Bronze Knight.", key, worldState);
        sendNPCMessage("Great. Talk to Brother Martin. He might have some more information.", target, key, worldState);
    } else if (userPriv.q012 == 5) {
        sendCharacterMessage("I've learned what I could from Brother Martin.", key, worldState);
        sendNPCMessage("Time to talk to the Iron Hero across the sea.", target, key, worldState);
    } else if (userPriv.q012 == 6) {
        sendCharacterMessage("I have the key to the entrance and learned about the monsters inside.", key, worldState);
        if (getTotalQuantityOfItemInInventory('key', userPriv) == 0) {
            sendCharacterMessage("Oops, I must've lost the key.", key, worldState);
            return;
        } else {
            removeAmountFromSlot(getItemSlot('key', userPriv), 1, userPriv);
            userPriv.q012 = 7;
            sendInfoTargetMessage("You hand him the key.", ["key", 1], key, worldState);
        }
    }
    if (userPriv.q012 == 7) {
        sendCharacterMessage("The Bronze Knight told me about the small dragons. Green ones are weak to archery, red ones to other attacks.", key, worldState);
        sendCharacterMessage("Brother Martin warned me about the Yammer. Feed it meat when it’s bronze, fish when it’s iron.", key, worldState);
        sendCharacterMessage("The Iron Hero told me something about spiders.", key, worldState)
        sendNPCMessage("Good, you’re prepared. But the most formidable foe is the great dragon Kook. He’s fierce and powerful.", target, key, worldState);
        sendNPCMessage("All I can advise is peristence. But defeating him can bring a great reward, his scale.", target, key, worldState);
        sendNPCMessage("Whoever wears it as a necklace will attract great possessions, but I can't say at what cost.", target, key, worldState)
        sendNPCMessage("Now, go in there and claim your victory!", target, key, worldState)
    }
    if (userPriv.q012 == 8) {
        sendCharacterMessage("I defeated Kook.", key, worldState);
        sendNPCMessage("Great job! I never thought I’d live to see the day Kook was defeated. Now I can die in peace.", target, key, worldState);
        sendNPCMessage("Here, take this as your reward.", target, key, worldState);
        if (addToFirstInventorySlot(userPriv, definitions["nickelbronze_necklace"], 1)) {
            sendInfoTargetMessage("He hands you a nickel bronze necklace", ["nickelbronze_necklace", 1], key, worldState);
            userPriv.q012 = 9;
            sendNPCMessage("Wear it well. Its power is now yours.", target, key, worldState);
        } else {
            sendCharacterMessage("I don't have room in my inventory.", key, worldState);
        }
    } else if (userPriv.q012 == 9) {
        sendNPCMessage("I can die in peace now. Thank you.", target, key, worldState)
    }
}

export function DragonBossDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q012 == 7) {
        userPriv.q012 = 8;
    }
}

export function overrideKnightConversationInnocentBlood(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    
    if (userPriv.q012 == 1) {
        sendCharacterMessage('Do you know anything about the volcano?', key, worldState);
        sendNPCMessage("Know about it? I know enough to stay far away, regardless of how much the king pays me.", target, key, worldState);
        sendNPCMessage("But if you’re foolish enough to enter, you’ll need to deal with its two guardians. They hold the key to unlocking its secrets.", target, key, worldState);
        sendNPCMessage("The first is Pydar, the storm demon. He lives just north of here and fights with wind and water.", target, key, worldState);
        sendNPCMessage("You’ll need divine strength to stand a chance against him.", target, key, worldState);
        userPriv.q012 = 2;
    }
    if (userPriv.q012 == 2) {
        sendNPCMessage("After defeating Pydar, return to me. If you survive, you might have a chance in the volcano and I can tell you more about it.", target, key, worldState);
        return true;
    }
    if (userPriv.q012 == 3) {
        if (getTotalQuantityOfItemInInventory('key_teeth', userPriv) == 0) {
            sendNPCMessage("It looks like you don't have the key. You need to try again.", target, key, worldState);
            return true;
        } else {
            sendNPCMessage("Nice, you did it.", target, key, worldState);
            userPriv.q012 = 4;
        }
    }

    if (userPriv.q012 == 4) {
        sendNPCMessage("I'll tell you what I know about the volcano. Inside there are two types of small dragons.", target, key, worldState);
        sendNPCMessage("A green one fights with fire and wind. You can use your prayers to block its attacks while fighting it with archery.", target, key, worldState);
        sendNPCMessage("A red one fights with melee. It's strong against archery but weak against other attacks.", target, key, worldState);
        sendNPCMessage("Now go talk to Brother Martin. He might have some more information.", target, key, worldState);
        return true;
    }

    return false;
}

export function PydarDefeatHook(key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q012 == 2) {
        userPriv.q012 = 3;
    }
}


export function overrideBrotherConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q012 == 4) {
        sendCharacterMessage('Do you know anything about the volcano?', key, worldState);
        sendNPCMessage("Yes, unfortunately I know it all too well. It's filled with fire, ash, and the worst type of wickedness.", target, key, worldState);
        sendCharacterMessage("I got a part of a key after defeating Pydar. Do you know anything about the other half?", key, worldState);
        sendNPCMessage("The other half is guarded by the Water Goblin. He’s tricky though, you can't just bash your way through him.", target, key, worldState);
        sendNPCMessage("You’ll need to think outside the box. I’ve seen him fiddling with some strange contraptions in there. Maybe you can figure out how to turn his own genius against him.", target, key, worldState);
        return true;
    }
    if (userPriv.q012 == 5) {
        sendNPCMessage('Great. You’ve defeated the Water Goblin. Now you should have the key to the entrance.', target, key, worldState);
        sendNPCMessage("I'll tell you what I know about the volcano. Be cautious inside. It’s crawling with demons.", target, key, worldState);
        sendNPCMessage("The most dangerous is the Yammer. His hunger is endless and he's never satisfied. To defeat him, you have to feed him the food he secretly hates.", target, key, worldState);
        sendNPCMessage("When he's iron, offer cooked fish; when he’s bronze, cooked meat.", target, key, worldState);
        sendNPCMessage("Now go to the Iron Hero across the sea. He'll help with final preparations for the battle.", target, key, worldState);
        return true;
    }
    return false;
}

export function WaterGoblinDefeatHook(targetKey, worldState) {
    if (!worldState.pub[targetKey]) return;
    var characters = getNearbyCharacters(worldState.pub[targetKey], 32, worldState, false);
    for (var char of characters) {
        var userPriv = worldState.priv[char.i];
        if (!userPriv) continue;
        if (userPriv.q012 == 4) {
            userPriv.q012 = 5;
        }
    }
}

export function overrideHeroConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    if (userPriv.q012 == 5 || userPriv.q012 == 6) {
        sendCharacterMessage('I’m looking for more information about the volcano.', key, worldState);
        sendNPCMessage("Greetings, traveler. The volcano! A place that tests the mettle of even the bravest of knights. ", target, key, worldState);
        sendNPCMessage("I’ve ventured there myself, and I must warn you, it is no ordinary trial. Beware the giant spiders that dwell within.", target, key, worldState);
        sendNPCMessage("Deadly creatures! A single bite can spell doom. I lost both my feet to their venomous fangs, yet I emerged victorious. Such is the price of bravery.", target, key, worldState);
        sendNPCMessage("Some archers take shots from a distance and flee like cowards. Others burn them with fire—still cowardly, if you ask me.", target, key, worldState);
        sendNPCMessage("True heroes face their foes head-on, as I did, crushing them with a single blow.", target, key, worldState);
        sendNPCMessage("Not everyone possesses my strength, but perhaps, with time, you might prove yourself worthy.", target, key, worldState);
        sendNPCMessage("If you seek to hone your skills, there are smaller spiders in the wasteland. Their eggs make excellent bait for fishing—a useful skill for any adventurer.", target, key, worldState);
        sendNPCMessage("Now, go forth to the volcano. One day, you might even approach me in courage.", target, key, worldState);
        userPriv.q012 = 6;
        return true;
    }
    return false;
}

export function overrideInnocentBloodTransport(key, worldState) {
    var priv = worldState.priv[key];
    if (priv.q012 >= 7) {
        return true;
    }
    sendCharacterMessage("I can't get in here yet.", key, worldState);
    return false;
}