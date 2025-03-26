
// handle fight arena behavior
// open/close doors on toggle
// open doors when fight is complete
// open doors when no more players in arena

import { addDoorCollision, removeDoorCollision } from "../actions/move_action.js";
import { definitions } from "../loader.js";
import { addToFirstInventorySlot, generateUUID, getSquareString } from "../utils.js";
import * as WorldState from '../world_state.js';
import Behaviors, { addBehavior, removeBehavior } from '../behaviors.js';
import { sendCharacterMessage, sendInfoTargetMessage, sendNPCMessage } from "../message.js";

var state = 0;
var arenaSquares = [];
var arenaSquaresMap = {};
for (var i = 16; i <= 25; i++) {
    for (var j = 2; j <= 9; j++) {
        arenaSquares.push([i, j]);
        arenaSquaresMap[i + '-' + j] = true;
    }
}

function areCharactersInArena(worldState) {
    var squareStrings = {};
    for (var square of arenaSquares) {
        var squareString = getSquareString(486, 512, square[0], square[1]);
        squareStrings[squareString] = true;
    }
    for (var squareString in squareStrings) {
        var ids = worldState.squares[squareString];
        for (var id in ids) {
            var pub = worldState.pub[id];
            if (arenaSquaresMap[pub.lx + '-' + pub.ly] && pub.t == 'character') return true;
        }
    }
    return false;
}
function getCharactersInArena(worldState) {
    var squareStrings = {};
    var characters = [];
    for (var square of arenaSquares) {
        var squareString = getSquareString(486, 512, square[0], square[1]);
        squareStrings[squareString] = true;
    }
    for (var squareString in squareStrings) {
        var ids = worldState.squares[squareString];
        for (var id in ids) {
            var pub = worldState.pub[id];
            if (arenaSquaresMap[pub.lx + '-' + pub.ly] && pub.t == 'character') characters.push(pub.i);;
        }
    }
    return characters;
}

function areEnemiesInArena(worldState) {
    for (var uuid of uuids) {
        if (worldState.pub[uuid]) return true;
    }
    return false;
}
var uuids = [generateUUID(), generateUUID(), generateUUID()]
var waves = [
    [{
        "pub": {
            "t": "giant_goblin_square",
            "i": uuids[0],
            "lsx": 486,
            "lsy": 512,
            "lx": 17.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_square"
        }
    }],
    [    {
        "pub": {
            "t": "giant_goblin_round",
            "i": uuids[1],
            "lsx": 486,
            "lsy": 512,
            "lx": 23.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_round"
        }
    }],
    [{
        "pub": {
            "t": "giant_goblin_kite",
            "i": uuids[2],
            "lsx": 486,
            "lsy": 512,
            "lx": 20.5,
            "ly": 7.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_kite"
        }
    }],
    [{
        "pub": {
            "t": "giant_goblin_square",
            "i": uuids[0],
            "lsx": 486,
            "lsy": 512,
            "lx": 17.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_square"
        }
    },
    {
        "pub": {
            "t": "giant_goblin_round",
            "i": uuids[1],
            "lsx": 486,
            "lsy": 512,
            "lx": 23.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_round"
        }
    }
    ],
    [{
        "pub": {
            "t": "giant_goblin_square",
            "i": uuids[0],
            "lsx": 486,
            "lsy": 512,
            "lx": 17.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_square"
        }
    },
    {
        "pub": {
            "t": "giant_goblin_kite",
            "i": uuids[2],
            "lsx": 486,
            "lsy": 512,
            "lx": 20.5,
            "ly": 7.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_kite"
        }
    }],
    [{
        "pub": {
            "t": "giant_goblin_round",
            "i": uuids[1],
            "lsx": 486,
            "lsy": 512,
            "lx": 23.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_round"
        }
    },
    {
        "pub": {
            "t": "giant_goblin_kite",
            "i": uuids[2],
            "lsx": 486,
            "lsy": 512,
            "lx": 20.5,
            "ly": 7.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_kite"
        }
    }
    ],
    [{
        "pub": {
            "t": "giant_goblin_square",
            "i": uuids[0],
            "lsx": 486,
            "lsy": 512,
            "lx": 17.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_square"
        }
    },
    {
        "pub": {
            "t": "giant_goblin_round",
            "i": uuids[1],
            "lsx": 486,
            "lsy": 512,
            "lx": 23.5,
            "ly": 3.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_round"
        }
    },
    {
        "pub": {
            "t": "giant_goblin_kite",
            "i": uuids[2],
            "lsx": 486,
            "lsy": 512,
            "lx": 20.5,
            "ly": 7.5,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "giant_goblin_kite"
        }
    },
],
];

function resetArena(worldState) {
    state = 0;
    openDoors(worldState);
    var lever = worldState.pub[worldState.ids['lever.fight_arena']]
    lever.ssw = 0;
    for (var uuid of uuids) {
        WorldState.removeObject(worldState.pub[uuid])
        removeBehavior(uuid);
    }
}

export default class FightArenaBehavior {
    constructor() {
        this.tick = 0;
    }
    update(worldState) {
        this.tick += 1;
        if (this.tick % 5 == 0 && state > 0) {
            if (!areCharactersInArena(worldState)) {
                resetArena(worldState);
                return;
            }
            if (state % 2 != 0 && (state - 1) /2 < waves.length) { // start wave 1
                var index = (state - 1) / 2
                for (var i = 0; i < waves[index].length; i++) {
                    var item = structuredClone(waves[index][i]);
                    var config = definitions[item.pub.t];
                    if (config && config.behavior) {
                        var behaviorConfig = structuredClone(config.behavior);
                        behaviorConfig.respawn = false;
                        var Behavior = Behaviors[behaviorConfig.type];
                        addBehavior(new Behavior(item, behaviorConfig));
                    }
                    WorldState.addObject(item.pub, item.priv);
                }
                state += 1;
            }
            if (!areEnemiesInArena(worldState)) {
                state += 1;
            }
            if (state == waves.length * 2 + 1) {
                var characters = getCharactersInArena(worldState);
                for (var uuid of characters) {
                    if (worldState.priv[uuid].q009 < 2) {
                        worldState.priv[uuid].q009 = 2;
                    }
                }
                resetArena(worldState)
            }
        }
    }
}

function closeDoors(worldState) {
    var key = worldState.ids['gate.a'];
    var doorA = worldState.pub[key];
    var doorAPriv = worldState.priv[key];
    var doorBKey = worldState.ids['gate.b'];
    var doorB = worldState.pub[doorBKey];
    var doorBPriv = worldState.priv[doorBKey];
    removeDoorCollision(doorA);
    removeDoorCollision(doorB);
    if (!doorAPriv.stateDoor) {
        doorAPriv.stateDoor = 1;
        doorA.lr -= 1;
    }
    if (!doorBPriv.stateDoor) {
        doorBPriv.stateDoor = 1;
        doorB.lr += 1;
    }
    addDoorCollision(doorA);
    addDoorCollision(doorB);
}
function openDoors(worldState) {
    var key = worldState.ids['gate.a'];
    var doorA = worldState.pub[key];
    var doorAPriv = worldState.priv[key];
    var doorBKey = worldState.ids['gate.b'];
    var doorB = worldState.pub[doorBKey];
    var doorBPriv = worldState.priv[doorBKey];
    removeDoorCollision(doorA);
    removeDoorCollision(doorB);
    if (doorAPriv.stateDoor) {
        doorAPriv.stateDoor = 0;
        doorA.lr += 1;
    }
    if (doorBPriv.stateDoor) {
        doorBPriv.stateDoor = 0;
        doorB.lr -= 1;
    }
    addDoorCollision(doorA);
    addDoorCollision(doorB);

}
// called whenever lever is toggled
export function FightArenaToggleHandler(key, targetKey, worldState) {
    
    if (state == 0) {
        closeDoors(worldState);
        state = 1;
        var lever = worldState.pub[worldState.ids['lever.fight_arena']]
        lever.ssw = 1;
    } else {
        resetArena(worldState);
    }
}


export function overrideKnightConversation(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];

    if (userPriv.q009 == 0 || userPriv.q009 == 1) {
        sendNPCMessage("Welcome to the fight arena. Pull that switch and fight your way through.", target, key, worldState);
        sendNPCMessage("You know that weapons use different combat styles, right?", target, key, worldState);
        sendNPCMessage("Square shields are weak against slash, kite shields are weak against crush, and round shields are weak against stab.", target, key, worldState);
        sendNPCMessage("That knowledge will help you. Only a true warrior can wear this bronze necklace.", target, key, worldState);
        userPriv.q009 = 1;
        return true;
    } else if (userPriv.q009 == 2) {
        sendNPCMessage("Congratulations. You made it through the fight!", target, key, worldState);
        if (!addToFirstInventorySlot(userPriv, definitions['bronze_necklace'], 1)) {
            sendCharacterMessage("I don't have room in my inventory.", key, worldState);
            return true;
        } else {
            sendInfoTargetMessage('He hands you a bronze necklace.', ['bronze_necklace', 1], key, worldState);
            userPriv.q009 = 3;
            return true;
        }
        
    } else {
        return false;
    }
}