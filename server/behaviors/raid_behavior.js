import { definitions, setAnimation } from "../loader.js";
import { generateUUID, getSquareString, removeAmountFromSlot } from "../utils.js";
import { isLoggedIn } from "../world_state.js";
import * as WorldState from '../world_state.js';
import Behaviors, { addBehavior, removeBehavior } from '../behaviors.js';

var state = 0;
var uuids = [
    generateUUID(),
    generateUUID(),
    generateUUID(),
    generateUUID(),
    generateUUID(),
];
var squareStrings = [
    getSquareString(496, 499, 16, 16),
    getSquareString(496, 499, 16, 24),
    getSquareString(496, 499, 16, 32),
    getSquareString(496, 499, 24, 16),
    getSquareString(496, 499, 24, 24),
    getSquareString(496, 499, 24, 32),
    getSquareString(496, 499, 32, 16),
    getSquareString(496, 499, 32, 24),
    getSquareString(496, 499, 32, 32)
];

function getCharactersInArena(worldState) {
    var characters = {};
    for (var squareString of squareStrings) {
        var ids = worldState.squares[squareString];
        for (var id in ids) {
            if (isLoggedIn(id)) {
                characters[id] = true;
            }
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

function resetArena(worldState) {
    state = 0;
    for (var uuid of uuids) {
        WorldState.removeObject(worldState.pub[uuid])
        removeBehavior(uuid);
    }
}

var waves = [
    [{
        "pub": {
            "t": "bronze_spider",
            "i": uuids[0],
            "lsx": 496,
            "lsy": 499,
            "lx": 35,
            "ly": 21,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "bronze_spider"
        },
        "path": [[0, 0],[0, 14],[-14, 14],[-14, 0]]
    }],
    [
        {
            "pub": {
                "t": "dragon_fighter",
                "i": uuids[0],
                "lsx": 496,
                "lsy": 499,
                "lx": 35.5,
                "ly": 21.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_fighter"
            }
        },
        {
            "pub": {
                "t": "dragon_ranger",
                "i": uuids[1],
                "lsx": 496,
                "lsy": 499,
                "lx": 21.5,
                "ly": 21.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_ranger",
                "iw": "wooden_longbow",
                "i0": ["invisible_fire_ball", 999999999]
            }
        }
    ],
    [{
        "pub": {
            "t": "idol_monster",
            "i": uuids[0],
            "lsx": 496,
            "lsy": 499,
            "lx": 35,
            "ly": 21,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0,
            "sm": 1,
        },
        "priv": {
            "id": "idol_monster"
        }
    }],
    [{
        "pub": {
            "t": "bronze_spider",
            "i": uuids[0],
            "lsx": 496,
            "lsy": 499,
            "lx": 35,
            "ly": 21,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "bronze_spider"
        },
        "path": [[0, 0],[0, 14],[-14, 14],[-14, 0]]
    },{
        "pub": {
            "t": "bronze_spider",
            "i": uuids[1],
            "lsx": 496,
            "lsy": 499,
            "lx": 21,
            "ly": 21,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        "priv": {
            "id": "bronze_spider"
        },
        "path": [[0, 0],[14, 0], [14, 14],[0, 14]]
    }],
    [
        {
            "pub": {
                "t": "dragon_fighter",
                "i": uuids[0],
                "lsx": 496,
                "lsy": 499,
                "lx": 35.5,
                "ly": 21.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_fighter"
            }
        },
        {
            "pub": {
                "t": "dragon_ranger",
                "i": uuids[1],
                "lsx": 496,
                "lsy": 499,
                "lx": 21.5,
                "ly": 21.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_ranger",
                "iw": "wooden_longbow",
                "i0": ["invisible_fire_ball", 999999999]
            }
        },
        {
            "pub": {
                "t": "dragon_fighter",
                "i": uuids[2],
                "lsx": 496,
                "lsy": 499,
                "lx": 21.5,
                "ly": 35.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_fighter"
            }
        },
        {
            "pub": {
                "t": "dragon_ranger",
                "i": uuids[3],
                "lsx": 496,
                "lsy": 499,
                "lx": 35.5,
                "ly": 35.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_ranger",
                "iw": "wooden_longbow",
                "i0": ["invisible_fire_ball", 999999999]
            }
        }
    ],
    [
        {
            "pub": {
                "t": "idol_monster",
                "i": uuids[0],
                "lsx": 496,
                "lsy": 499,
                "lx": 35,
                "ly": 21,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0,
                "sm": 1,
            },
            "priv": {
                "id": "idol_monster"
            }
        },
        {
            "pub": {
                "t": "idol_monster",
                "i": uuids[1],
                "lsx": 496,
                "lsy": 499,
                "lx": 21,
                "ly": 21,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0,
                "sm": 0,
            },
            "priv": {
                "id": "idol_monster"
            }
        }
    ],
    [
        {
            "pub": {
                "t": "bronze_spider",
                "i": uuids[0],
                "lsx": 496,
                "lsy": 499,
                "lx": 35,
                "ly": 21,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "bronze_spider"
            },
            "path": [[0, 0],[0, 14],[-14, 14],[-14, 0]]
        },
        {
            "pub": {
                "t": "idol_monster",
                "i": uuids[1],
                "lsx": 496,
                "lsy": 499,
                "lx": 21,
                "ly": 21,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0,
                "sm": 0,
            },
            "priv": {
                "id": "idol_monster"
            }
        },
        {
            "pub": {
                "t": "dragon_fighter",
                "i": uuids[2],
                "lsx": 496,
                "lsy": 499,
                "lx": 21.5,
                "ly": 35.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_fighter"
            }
        },
        {
            "pub": {
                "t": "dragon_ranger",
                "i": uuids[3],
                "lsx": 496,
                "lsy": 499,
                "lx": 35.5,
                "ly": 35.5,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0
            },
            "priv": {
                "id": "dragon_ranger",
                "iw": "wooden_longbow",
                "i0": ["invisible_fire_ball", 999999999]
            }
        }
    ],
    [
        {
            "pub": {
                "t": "dragon_boss",
                "i": uuids[0],
                "lsx": 496,
                "lsy": 499,
                "lx": 28,
                "ly": 28,
                "lr": 2,
                "lf": 0,
                "li": 0,
                "sa": 0,
                "sm": 0,
            },
            "priv": {
                "id": "dragon_boss",
                "iw": "wooden_longbow",
                "i0": ["invisible_fire_ball", 999999999]
            }
        }
    ]
]

export default class RaidBehavior {
    constructor() {
        this.tick = 0;
        this.scores = {};
    }
    update(worldState) {
        this.tick += 1;
        if (this.tick % 5 == 0) {
            var characters = getCharactersInArena(worldState);
            // if not present, then remove from scores
            for (var id in this.scores) {
                if (!characters[id]) {
                    delete this.scores[id];
                }
            }
            if (Object.keys(characters).length == 0) {
                resetArena(worldState);
                this.scores = {};
                return;
            }

            if (state % 3 == 0) {
                for (var id in characters) {
                    if (!this.scores[id]) { this.scores[id] = 0; }
                    this.scores[id] += 1;
                    if (worldState.serv[id]) {
                        worldState.serv[id].raidOneScore = Math.max(worldState.serv[id].raidOneScore, this.scores[id]);
                    }
                }
                var index = (state / 3) % waves.length;
                var multiplier = Math.pow(1.5, Math.floor(state / (waves.length * 3)));
                state += 1;
                for (var i = 0; i < waves[index].length; i++) {
                    var item = structuredClone(waves[index][i]);
                    var config = definitions[item.pub.t];
                    if (config && config.behavior) {
                        var behaviorConfig = structuredClone(config.behavior);
                        behaviorConfig.respawn = false;
                        if (item.path) {
                            behaviorConfig.path = item.path;
                        }
                        // accuracy, strength, hitpoints
                        behaviorConfig.accuracy = behaviorConfig.accuracy ? Math.floor(behaviorConfig.accuracy * multiplier) : Math.floor(multiplier);
                        behaviorConfig.strength = behaviorConfig.strength ? Math.floor(behaviorConfig.strength * multiplier) : Math.floor(multiplier);
                        behaviorConfig.hitpoints = behaviorConfig.hitpoints ? Math.floor(behaviorConfig.hitpoints * multiplier) : Math.floor(multiplier);
                        // set custom path?
                        var Behavior = Behaviors[behaviorConfig.type];
                        addBehavior(new Behavior(item, behaviorConfig));
                    }
                    WorldState.addObject(item.pub, item.priv);
                }
            } else if (!areEnemiesInArena(worldState)) {
                state += 1;
            }
        }
    }
}

export function IdolMonsterUseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    var firstItem = userPriv[slots[0]][0];
    var definition = definitions[firstItem];
    if (definition && definition.eatBehavior) {
        if (target.sm == 1 && firstItem.includes('meat')) {
            target.sm = 0;
            removeAmountFromSlot(slots[0], 1, userPriv);
            target.hp -= 10;
            if (target.hp < 0) target.hp = 0;
            if (target.hp == 0) {
                setAnimation(target, 'die');
                WorldState.markDeath(target, 'Player');
            }
        } else if(target.sm == 0 && !firstItem.includes('meat')) {
            target.sm = 1;
            removeAmountFromSlot(slots[0], 1, userPriv);
            target.hp -= 10;
            if (target.hp < 0) target.hp = 0;
            if (target.hp == 0) {
                setAnimation(target, 'die');
                WorldState.markDeath(target, 'Player');
            }
        }
    }
    return;
}