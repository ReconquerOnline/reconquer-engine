
/*
Quest states
0: initial state
1: told that garden needs flowers
2: garden has flowers, needs dog
3: Returned dog, asked for 10 coins
4: Received ten coins, gives hat.
*/

import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage, sendOptionMessage } from "../message.js";
import { addToFirstInventorySlot, getSquareString, getTotalQuantityOfItemInInventory, removeAmountFromInventory } from "../utils.js";
import { getAction, removeAction } from "../world_state.js";
import FollowAction from "../actions/follow_action.js";
import { definitions } from "../loader.js";

function getNumberOfFlowers(worldState) {
    // see if all squares are flowers
    // 496, 501 lf 0,
    // check if garden is filled with flowers
    var squares = [
        [9, 53], [10, 53], [11, 53], [12, 53], [13, 53], [14, 53],
        [9, 54], [10, 54], [11, 54], [12, 54], [13, 54], [14, 54],
        [9, 55], [10, 55], [11, 55], [12, 55], [13, 55], [14, 55],
        [9,56],[10,56],[11,56],[12,56],[13,56],[14,56]
    ];
    var flowerStrings = {};
    var squareStrings = {};
    for (var square of squares) {
        var squareString = getSquareString(486, 511, square[0], square[1]);
        squareStrings[squareString] = true;
        flowerStrings[squareString + ',' + square[0] + ',' + square[1]] = false;
    }

    var numFlowers = 0;
    for (var squareString in squareStrings) {
        var ids = worldState.squares[squareString];
        for (var id in ids) {
            var pub = worldState.pub[id];
            var flowerString = squareString + ',' + pub.lx + ',' + pub.ly;
            if (flowerStrings[flowerString] !== undefined && pub.t.includes('flowers')) {
                numFlowers += 1;
            }
        }
    }
    return numFlowers
}

export function overrideGardenerConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    // Told that garden needs flowers
    if (userPriv.q008 == 0) {
        var numFlowers = getNumberOfFlowers(worldState);
        if (numFlowers < 24) {
            sendNPCMessage("Hi. It's about time you got here. I need you to fill this garden with flowers.", target, key, worldState);
            userPriv.q008 = 1;
        } else {
            sendNPCMessage("Hi, I'm the gardener. Do you see all the hard work I've put into this garden?", target, key, worldState);
            sendNPCMessage("It is the most perfect, complete, full garden.", target, key, worldState);
        }
    } else if (userPriv.q008 == 1) {
        var numFlowers = getNumberOfFlowers(worldState);
        if (numFlowers < 24) {
            sendNPCMessage("We still need more flowers in this garden.", target, key, worldState);
        } else {
            userPriv.q008 = 2;
            sendNPCMessage("Great. You did it. You know, I also lost my dog. I need you to find him and bring him back to me.", target, key, worldState);
            return;
        }
    }

    var dogId = worldState.ids['dog'];
    if (userPriv.q008 == 2) {
        var dogId = worldState.ids['dog'];
        if (dogId && getAction(dogId) && getAction(dogId) instanceof FollowAction && getAction(dogId).target == key) {
            removeAction(dogId);
            userPriv.q008 = 3;
        } else {
            sendNPCMessage("Great. You did it. You know, I also lost my dog. I need you to find him and bring him back to me.", target, key, worldState);
        }
    }

    if (userPriv.q008 == 3) {
        if (interaction == 'Really? Okay here you go.') {
            sendCharacterMessage("Really? Okay here you go.", key, worldState);
            if (getTotalQuantityOfItemInInventory('coins', userPriv) < 10) {
                sendCharacterMessage("I don't have enough coins.", key, worldState);
                return;
            }
            removeAmountFromInventory('coins', 10, userPriv);
            sendInfoTargetMessage('You hand over ten coins', ['coins', 10], key, worldState);
            userPriv.q008 = 4;
        } else if (interaction == 'No way!') {
            sendCharacterMessage("No, you're on your own.", key, worldState);
        } else {
            sendNPCMessage("Thanks. I missed him. One more thing. I owe the goblins some money. Can I have ten coins?", target, key, worldState);
            sendOptionMessage(['Really? Okay here you go.', 'No way!'], target, key, worldState);
        }
    }

    if (userPriv.q008 == 4) {
        if (interaction == "Well, can I at least have your hat?") {
            sendNPCMessage("Okay, fine, you can have my hat.", target, key, worldState);
            if (!addToFirstInventorySlot(userPriv, definitions['straw_hat'], 1)) {
                sendCharacterMessage("I don't have room in my inventory.", key, worldState);
                return;
            } else {
                sendInfoTargetMessage('He hands you his straw hat.', ['straw_hat', 1], key, worldState);
                userPriv['cid.gardener.she'] = 0;
                userPriv.q008 = 5;
                sendNPCMessage("We did a great job taking care of the garden.", target, key, worldState);
                return;
            }
        } else if (interaction == "I'll just leave then.") {
            sendCharacterMessage("Alright. I'm leaving.", key, worldState);
        } else {
            sendNPCMessage("Thanks. I don't really have anything to give to you.", target, key, worldState);
            sendCharacterMessage("After all that, you can't give me anything?", key, worldState);
            sendNPCMessage("Nope.", target, key, worldState);
            sendOptionMessage(["Well, can I at least have your hat?", "I'll just leave then."], target, key, worldState);
        }
    }
    if (userPriv.q008 == 5) {
        sendNPCMessage("We did a great job taking care of the garden.", target, key, worldState);   
    }
}