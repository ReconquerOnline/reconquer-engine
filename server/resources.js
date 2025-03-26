import { definitions, setAnimation } from "./loader.js";
import { sendCharacterMessage, sendInfoMessage, sendInfoTargetMessage, sendNPCMessage } from './message.js';
import { moveAndRotateTowardsTarget } from "./action_utils.js";
import { addToFirstInventorySlot, calculateCombatLevel, canAddToInventory, distanceBetween, generateUUID, matchesLocation, removeAmountFromSlot } from './utils.js';
import Behaviors, { addBehavior, removeBehavior } from './behaviors.js';
import * as WorldState from './world_state.js';
import { subscribe } from "./signals.js";

var resources = {
    resourceA: {
        owner: null,
        defenders: [],
        totalDefenders: 0,
        maxDefenders: 20,
        reservedOwner: null,
        reservedOwnerExpiration: null,
        lastOwner: null,
        defendersOut: 0,
        maxLevel: 20,
        lastDefeater: null,
        essenceForgeId: null,
        shop: {
            "mi0": {
                "itemId": "shrimp_meat_raw",
                "quantity": 0,
            },
            "mi1": {
                "itemId": "sardine_meat_raw",
                "quantity": 0,
            },
            "mi2": {
                "itemId": "catfish_meat_raw",
                "quantity": 0,
            }
        },
        dropTable: [
            [
                0,
                "shrimp_meat_raw",
            ],
            [
                450,
                "sardine_meat_raw",
            ],
            [
                900,
                "catfish_meat_raw",
            ]
        ],
        dropFrequency: 100, // every 60 seconds 
        uuids: [generateUUID(), generateUUID(), generateUUID(), generateUUID()],
        locationDeltas: [[0.5,0.5],[-0.5,0.5],[0.5,-0.5],[-0.5,-0.5]],
        spawnLocations: [
        {
            "lsx": 486,
            "lsy": 512,
            "lx": 32,
            "ly": 26,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 486,
            "lsy": 512,
            "lx": 31,
            "ly": 26,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 486,
            "lsy": 512,
            "lx": 32,
            "ly": 25,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 486,
            "lsy": 512,
            "lx": 31,
            "ly": 25,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        }]
    },
    resourceB: {
        owner: null,
        defenders: [],
        totalDefenders: 0,
        maxDefenders: 20,
        reservedOwner: null,
        reservedOwnerExpiration: null,
        lastOwner: null,
        defendersOut: 0,
        maxLevel: 40,
        lastDefeater: null,
        essenceForgeId: null,
        masterTalkOverride: "I'm hard at work as always.",
        freeTalkOverride: "I just work and work and work and work.",
        shop: {
            "mi0": {
                "itemId": "copper_ore",
                "quantity": 0,
            },
            "mi1": {
                "itemId": "zinc_ore",
                "quantity": 0,
            },
            "mi2": {
                "itemId": "nickel_ore",
                "quantity": 0,
            }
        },
        dropTable: [
            [
                0,
                "copper_ore",
            ],
            [
                500,
                "zinc_ore",
            ],
            [
                940,
                "nickel_ore",
            ]
        ],
        dropFrequency: 100, // every 60 seconds 
        uuids: [generateUUID(), generateUUID(), generateUUID(), generateUUID()],
        locationDeltas: [[0.5,0.5],[-0.5,0.5],[0.5,-0.5],[-0.5,-0.5]],
        spawnLocations: [
        {
            "lsx": 485,
            "lsy": 511,
            "lx": 30,
            "ly": 62,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 485,
            "lsy": 511,
            "lx": 29,
            "ly": 62,
            "lr": 2,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 485,
            "lsy": 511,
            "lx": 30,
            "ly": 61,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        },
        {
            "lsx": 485,
            "lsy": 511,
            "lx": 29,
            "ly": 61,
            "lr": 0,
            "lf": 0,
            "li": 0,
            "sa": 0
        }]
    }
}

var uuidsToResources = {};
for (var key in resources) {
    var resource = resources[key];
    for (var uuid of resource.uuids) {
        uuidsToResources[uuid] = resource;
    }
}


export class ExamineResourceAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }d
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target]


        if (!target ||
            user.lf != target.lf ||
            user.li != target.li ||
            !targetPriv ||
            !resources[targetPriv.id.split('.')[1]]) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined && !matchesLocation(user, target)) {
            if (persist) {
                return true;
            } else if (persist == false && distanceBetween(user, target) > 3) {
                return false;
            }
        };
        setAnimation(user, 'idle');

        var resource = resources[targetPriv.id.split('.')[1]];
        if (!resource.owner && Date.now() < resource.reservedOwnerExpiration) {
            sendInfoMessage('This resource is currently reserved for "' + resource.reservedOwner + '" for one minute.', key, worldState);
        } else if (!resource.owner) {
            sendInfoMessage('No one currently controls this resource.', key, worldState);
            sendInfoMessage('You can gain ownership of this resource by depositing essence here.', key, worldState);
        } else if (resource.owner && resource.defenders.length + resource.defendersOut > 0) {
            sendInfoMessage('This currently belongs to "' + resource.owner + '" and is defended by ' + (resource.defenders.length + resource.defendersOut) + ' monsters.', key, worldState);
        }

        return false;
    }
}

function getCombatLevel(config) {
    var mhp = config.hitpoints ? config.hitpoints : 10;

    var kac = config.accuracy ? config.accuracy : 1;
    var kdc = config.defense ? config.defense : 1;
    var ksc = config.strength ? config.strength : 1;
    var karc = config.archery ? config.archery : 1;
    return calculateCombatLevel(kac, ksc, kdc, mhp, karc);

}

export class EssenceForgeUtilityAction {
    constructor(target, items) {
        this.target = target;
        this.items = items;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target.i];
        var targetPriv = worldState.priv[this.target.i];

        var resource = resources[targetPriv.id.split('.')[1]];
        if (!resource) {
            return false;
        }

        if (resource.owner && resource.owner != user.dn) {
            sendCharacterMessage("I don't currently control this. I need to defeat the defenders to acquire it.", key, worldState);
            return false;
        }

        if (resource.totalDefenders == resource.maxDefenders) {
            sendInfoMessage("You've reached the max number of defenders", key, worldState);
            return false;
        }

        if (!resource.owner && resource.reservedOwner && user.dn != resource.reservedOwner && Date.now() < resource.reservedOwnerExpiration) {
            sendInfoMessage("This is currently reserved by " + resource.reservedOwner + '.', key, worldState);
            return false;
        }

        if (!resource.owner || resource.owner == user.dn) {
            var numAdded = 1;
            var overMaxLevel = false;
            while (numAdded && !(resource.maxDefenders == resource.totalDefenders)) {
                numAdded = 0;
                for (var item of this.items) {
                    var quantity = userPriv[item.slot][1];
                    if (quantity && resource.totalDefenders < resource.maxDefenders) {

                        var config = definitions[item.interaction.generates.split('.')[0]];
                        if (!config) continue;
                        var behavior = config.behavior ? config.behavior : config.behaviors[item.interaction.generates];
                        if (behavior && getCombatLevel(behavior) < resource.maxLevel) {
                            removeAmountFromSlot(item.slot, 1, userPriv);
                            resource.defenders.push(item.interaction.generates);
                            resource.totalDefenders += 1;
                            numAdded += 1;
                        } else {
                            overMaxLevel = true;
                        }
                    }
                }
                if (numAdded > 0) {
                    resource.owner = user.dn;
                    target.sem = 1;
                    resource.essenceForgeId = target.i;
                }
            }
            if (overMaxLevel) {
                sendInfoMessage("The max level monster you can deposit here is " + resource.maxLevel + '.', key, worldState)
            }
        }
        return false;
    }
}

export class EssenceForgeBehavior {
    constructor() {
        this.tick = 0;
    }
    update(worldState) {
        this.tick += 1;


        for (var key in resources) {
            var resource = resources[key];
            if (this.tick % resource.dropFrequency == 0) {
                // roll drop
                var roll = Math.floor(Math.random() * 1000);
                var i = 0;
                var id, quantity;
                var dropTable = resource.dropTable;
                while (dropTable[i] !== undefined && roll > dropTable[i][0]) {
                    var result = dropTable[i][1];
                    id = typeof result === 'string' ? result : result[0];
                    quantity = typeof result === 'string' ? 1 : result[1];
                    i += 1;
                }
                // deposit in chest
                if (id && quantity) {
                    for (var i = 0; i < 16; i++) {
                        var slot = 'mi' + i;
                        var chest = worldState.pub[resource.chest];
                        if (chest[slot] && chest[slot][0] == id) {
                            chest[slot][1] += quantity;
                        }
                    }
                }
            }
        }

        if (this.tick % 5 == 0) {
            for (var key in resources) {
                var resource = resources[key];
                // check how many defenders are currently out
                var numDefenders = 0;
                for (var i = 0; i < resource.uuids.length; i++) {
                    var uuid = resource.uuids[i];
                    if (!worldState.pub[uuid]) {
                        if (resource.defenders.length > 0) {
                            var itemPub = structuredClone(resource.spawnLocations[i]);
                            itemPub.i = resource.uuids[i];
                            itemPub.t = resource.defenders[0].split('.')[0];
                            var item = {
                                pub: itemPub,
                                priv: { id: itemPub.t }
                            }
                            var config = definitions[item.pub.t];
                            if (config.dynamicCollisionSize == 2) {
                                item.pub.lx += resource.locationDeltas[i][0];
                                item.pub.ly += resource.locationDeltas[i][1];
                            }
                            if (!config) {
                                resource.defenders.shift();
                                continue;
                            }
                            var behavior = config.behavior ? config.behavior : config.behaviors[resource.defenders[0]];
                            if (behavior) {
                                var behaviorConfig = structuredClone(behavior);
                                behaviorConfig.respawn = false;
                                behaviorConfig.distance = 0;
                                behaviorConfig.frequency = 1000000;
                                behaviorConfig.maxDistance = 4;
                                behaviorConfig.aggressionDistance = 4;
                                behaviorConfig.wander = false;
                                behaviorConfig.disappearTicks = 0;
                                
                                // copy over server state
                                if (config.serverState && config.serverState[resource.defenders[0]]) {
                                    var serverState = config.serverState[resource.defenders[0]];
                                    if (serverState.priv) {
                                        for (var key in serverState.priv) {
                                            item.priv[key] = structuredClone(serverState.priv[key]);
                                        }
                                    }
                                    if (serverState.pub) {
                                        for (var key in serverState.pub) {
                                            item.pub[key] = structuredClone(serverState.pub[key]);
                                        }
                                    }
                                }
                                ((owner) => {
                                    behaviorConfig.customAggressionOverride = function (key, worldState) {
                                        var user = worldState.pub[key];
                                        if (user.dn == owner) {
                                            return true;
                                        }
                                        return false;
                                    }
                                })(resource.owner)

                                var Behavior = Behaviors[behaviorConfig.type];
                                addBehavior(new Behavior(item, behaviorConfig));
                            }
                            WorldState.addObject(item.pub, item.priv);
                            resource.defenders.shift();
                            numDefenders += 1;
                        }
                    } else {
                        numDefenders += 1;
                    }
                }
                resource.defendersOut = numDefenders;

                var lastDefeater = worldState.pub[resource.lastDefeater];
                if (resource.owner) {
                    if (lastDefeater && lastDefeater.dn && lastDefeater.dn != resource.owner) {
                        resource.reservedOwner = lastDefeater.dn;
                        resource.reservedOwnerExpiration = Date.now() + 1000 * 60;
                    } else {
                        resource.reservedOwner = null;
                        resource.reservedOwnerExpiration = null;
                    }
                }

                if (resource.defendersOut + resource.defenders.length == 0) {
                    // if there is currently an owner, set owner to null
                    if (resource.owner) {
                        resource.lastOwner = resource.owner;
                        resource.owner = null;
                        resource.totalDefenders = 0;
                        if (resource.essenceForgeId && worldState.pub[resource.essenceForgeId]) {
                            worldState.pub[resource.essenceForgeId].sem = 0;
                        }
                    }
                }
            }    
        }
    }
}


export class WithdrawResourceAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key]

        var target = worldState.pub[userPriv.mst];
        var targetPriv = worldState.priv[userPriv.mst]
        if (!targetPriv || !targetPriv.id) return;

        var resourceId = targetPriv.id.split('.')[1]
        if (!resourceId || !resources[resourceId]) return;
        
        var resource = resources[resourceId];
        
        if (resource.owner != user.dn) {
            sendCharacterMessage("I don't currently control this resource.", key, worldState)
            return;
        }

        if (distanceBetween(target, user) > 5) {
            sendCharacterMessage("I'm too far away.", key, worldState)
            return;
        }

        var itemId = target[this.target][0];

        var withdrawQuantity = 1;
        if (this.interaction == 'Withdraw All') {
            withdrawQuantity = 999999999;
        }

        var withdrawn = 0;
        while (withdrawn < withdrawQuantity && target[this.target][1] > 0) {
            if (canAddToInventory(userPriv, definitions[itemId])) {
                if (definitions[itemId].stackable) {
                    addToFirstInventorySlot(userPriv, definitions[itemId], target[this.target][1]);
                    target[this.target][1] = 0;
                    withdrawn = target[this.target][1];
                } else {
                    addToFirstInventorySlot(userPriv, definitions[itemId], 1);
                    withdrawn += 1;
                    target[this.target][1] -= 1;
                }
            } else {
                if (withdrawn == 0) {
                    sendNPCMessage("You don't have any space for that.", target, key, worldState);
                }
                break;
            }
        }
    }
}

export function CharacterResourceHandleInteraction(interaction, target, key, worldState) {
    var targetPriv = worldState.priv[target.i];
    var resourceId = targetPriv.id.split('.')[1];
    var resource = resources[resourceId];
    if (!resource) return;

    var user = worldState.pub[key]

    if (resource.owner == user.dn) {
        var message = "Greetings master. I'm working hard for you."
        if (resource.masterTalkOverride) {
            message = resource.masterTalkOverride;
        }
        sendNPCMessage(message, target, key, worldState)
    } else if (resource.owner) {
        sendNPCMessage('I currently work for ' + resource.owner + '.', target, key, worldState)
    } else {
        var message = 'I finally have some freedom.';
        if (resource.freeTalkOverride) {
            message = resource.freeTalkOverride;
        }
        sendNPCMessage(message, target, key, worldState)
    }
   
}

subscribe('death', function (object) {
    var resource = uuidsToResources[object.target];
    if (!resource) return;
    if (!WorldState.isLoggedIn(object.user)) return;
    uuidsToResources[object.target].lastDefeater = object.user;
});

subscribe('loaded', function () {
    for (var key in resources) {
        var chest = WorldState.getObjectsWithId('chest_resource.' + key)[0];
        resources[key].chest = chest;
        WorldState.worldState.pub[chest].dn = 'Resource Chest';
        WorldState.worldState.priv[chest].shop = true;
        WorldState.worldState.pub[chest].free = true;
        for (var i = 0; i < 16; i++) {
            var slot = 'mi' + i;
            if (!resources[key].shop[slot]) continue;
            WorldState.worldState.pub[chest][slot] = [resources[key].shop[slot].itemId, resources[key].shop[slot].quantity];
            
        }
    }
})