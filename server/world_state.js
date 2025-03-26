import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { distanceBetween, getSquareString } from './utils.js';
import { addDoorCollision, removeDoorCollision, addDynamicCollision, removeDynamicCollision } from './actions/move_action.js';
import { addBehavior, removeBehavior, updateBehaviors, getBehavior } from './behaviors.js';
import { definitions } from './loader.js';
import PlayerBehavior from './behaviors/player_behavior.js';
import ConfigOptions from './config_options.js';
import * as Database from './database.js';
import { handleFidelityForUser, updateFidelity } from './fidelity.js';
import { sendInfoTargetMessage } from './message.js';
import { cleanUpEmptyInstances } from './instance.js';
import AttackAction from './actions/attack_action.js';
import EatAction from './actions/eat_action.js';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

export var worldState = {
    squares: {},
    pub: {},
    priv: {},
    serv: {},
    ids: {}
};
var localState = {};
var actions = {};
var resumeActions = {};

var serverConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
for (var key in serverConfig.hierarchy) {
    var seg = key.split('-');
    var segX = seg[1];
    var segY = seg[2];
    for (var x = 0; x < 64; x += 8) {
        for (var y = 0; y < 64; y += 8) {
            worldState.squares[getSquareString(segX, segY, x, y)] = {};
        }
    }
}

export function addObject(pub, priv) {

    var squareString = getSquareString(
        pub.lsx,
        pub.lsy,
        pub.lx,
        pub.ly);
    if (!worldState.squares[squareString]) return;
    
    worldState.pub[pub.i] = pub;
    worldState.priv[pub.i] = priv;
    if (priv && priv.id) {
        worldState.ids[priv.id] = pub.i;
    }
    addDynamicCollision(pub, definitions[pub.t] && definitions[pub.t].dynamicCollisionSize);
    if (definitions[pub.t].doorCollision) {
        addDoorCollision(pub);
    }
    worldState.squares[squareString][pub.i] = true;
}

export function handleLogin(userInfo) {
    addObject(userInfo.pub, userInfo.priv);
    addBehavior(new PlayerBehavior(userInfo));
    worldState.serv[userInfo.pub.i] = userInfo.serv;

    localState[userInfo.pub.i] = {};
}

export function isLoggedIn(id) {
    return localState[id];
}

export function getNumberLoggedIn() {
    return Object.keys(localState).length;
}
export function getUUIDsOfLoggedIn() {
    return Object.keys(localState);
}

var deaths = {};
export function markDeath(pub, killerName, killerId) {
    if (deaths[pub.i]) return;
    deaths[pub.i] = { pub: pub, tick: 0, killerId: killerId };
    removeAction(pub.i);
}

export function removeObject(info) {
    if (!info) return;
    removeDynamicCollision(info, definitions[info.t] && definitions[info.t].dynamicCollisionSize);
    if (definitions[info.t].doorCollision) {
        removeDoorCollision(info);
    }
    removeAction(info.i);
    delete worldState.pub[info.i];
    delete worldState.priv[info.i];
    delete worldState.serv[info.i];
    for (var key in worldState.squares) {
        delete worldState.squares[key][info.i];
    }
}

export async function handleLogout(user) {
    if (!isLoggedIn(user)) return;

    if (deaths[user]) {
        handleDeath(user);
    }
    delete localState[user];
    delete resumeActions[user];
    removeAction(user);
    if (!worldState.pub[user]) return;
    var userInfo = {
        pub: worldState.pub[user],
        priv: worldState.priv[user],
        serv: worldState.serv[user],
    }
    removeObject(userInfo.pub);
    removeBehavior(userInfo.pub.i);
    await Database.saveUserInfo(userInfo);
}

// do not change pub state in this function, or else everyone's states will be out of sync
export function getLocalState(user) {
    var userInfo = worldState.pub[user];
    var currentSquare = [Math.floor(userInfo.lx / 8) * 8, Math.floor(userInfo.ly / 8) * 8];
    var ids = [];
    for (var x = -2; x <= 2; x++) {
        for (var y = -2; y <= 2; y++) {
            var squareX = currentSquare[0] + x * 8;
            var squareY = currentSquare[1] + y * 8;
            var segDeltaX = 0;
            var segDeltaY = 0;
            if (squareX >= 64) {
                squareX -= 64;
                segDeltaX = 1;
            } else if (squareX < 0) {
                squareX += 64;
                segDeltaX = -1;
            }
            if (squareY >= 64) {
                squareY -= 64;
                segDeltaY = 1;
            } else if (squareY < 0) {
                squareY += 64;
                segDeltaY = -1;
            }
            var squareString = getSquareString(userInfo.lsx + segDeltaX, userInfo.lsy + segDeltaY, squareX, squareY);
            var keysObject = worldState.squares[squareString] ? worldState.squares[squareString] : {};
            ids = ids.concat(Object.keys(keysObject));
        }
    }

    // calculate distances to nearby users in order to potentially cull out too many users
    var distances = new Array(64).fill(0);
    for (var key of ids) {
        if (worldState.pub[key].t != 'character' || worldState.pub[key].lf > userInfo.lf || worldState.pub[key].li != userInfo.li) {
            continue;
        }
        var distance = distanceBetween(worldState.pub[user], worldState.pub[key])
        distances[distance] += 1;

    }
    var number = 0;
    var cullDistance = 1;
    for (var i = 1; i < 64; i++) {
        number += distances[i];
        if (number > ConfigOptions.maxNearbyCharacters) break;
        cullDistance += 1;
    }

    var state = {};
    for (var key of ids) {
        if (worldState.pub[key].lf > userInfo.lf || worldState.pub[key].li != userInfo.li) {
            continue;
        }
        var distance = distanceBetween(worldState.pub[user], worldState.pub[key])
        if (worldState.pub[key].t != 'character' || (distance <= cullDistance && distance > 0)) {
            state[key] = worldState.pub[key];
        }
        if (key == user) {
            state[key] = structuredClone(worldState.pub[key]);
            for (var property in worldState.priv[key]) {
                state[key][property] = worldState.priv[key][property];
            }
            worldState.priv[key].mp = '';
            if (worldState.serv[key].mt > 0) { worldState.serv[key].mt -= 1; }
        }
    }
    localState[user] = state;
    return state;
}

function equals(a, b) {
    return (a == b) || (a != null && b != null && typeof a == 'object' && typeof b == 'object' && a[0] == b[0] && a[1] == b[1]);
}

function getDiff(oldState, newState) {
    var oldKeys = Object.keys(oldState).sort();
    var newKeys = Object.keys(newState).sort();

    var oldKeyPos = 0;
    var newKeyPos = 0;

    var diff = [];
    while (oldKeyPos < oldKeys.length || newKeyPos < newKeys.length) {
        // exists in both, check if object itself has changes
        if (oldKeys[oldKeyPos] == newKeys[newKeyPos]) {
            // compare individual object
            var oldObject = oldState[oldKeys[oldKeyPos]];
            var newObject = newState[newKeys[newKeyPos]];
            var diffObject = {};
            var hasDiff = false;
            for (var key in newObject) {
                if (!equals(newObject[key], oldObject[key])) {
                    diffObject[key] = newObject[key];
                    hasDiff = true;
                }
            }
            if (hasDiff) {
                diff.push({
                    'i': newKeys[newKeyPos],
                    't': 'c',
                    'o': diffObject
                });
            }
            oldKeyPos += 1;
            newKeyPos += 1;
        } else if (!newKeys[newKeyPos] || oldKeys[oldKeyPos] < newKeys[newKeyPos]) {
            // removed from old keys
            diff.push({
                'i': oldKeys[oldKeyPos],
                't': 'r',
            });
            oldKeyPos += 1;
        } else if (!oldKeys[oldKeyPos] || oldKeys[oldKeyPos] > newKeys[newKeyPos]) {
            // added to new keys
            diff.push({
                'i': newKeys[newKeyPos],
                't': 'a',
                'o': newState[newKeys[newKeyPos]]
            });
            newKeyPos += 1;
        }

    }
    return diff;

}

export function addAction(key, action) {
    // allow eating while attacking
    if (isLoggedIn(key)
        && actions[key] instanceof AttackAction
        && action instanceof EatAction) {
        resumeActions[key] = actions[key];
    } else {
        delete resumeActions[key];
    }
    removeAction(key);
    actions[key] = action;
}
export function getAction(key) {
    return actions[key];
}
export function removeAction(key) {
    var action = actions[key];
    if (action && action.cleanUp) {
        action.cleanUp(worldState);
    }
    delete actions[key];
}

function handleActions() {
    for (var key in actions) {
        if (deaths[key]) continue;
        var action = actions[key];
        if (!action) continue;
        var persist = action.handleTick(key, worldState);
        if (!persist) {
            removeAction(key)
            if (resumeActions[key]) {
                actions[key] = resumeActions[key];
                delete resumeActions[key];
            }
        }
    }
}

function clearMessages() {
    for (var key in localState) {
        if (worldState.serv[key].mt == 0) { worldState.pub[key].m = ''; }
    }
}

function clearAttackTargets() {
    for (var key in localState) {
        worldState.pub[key].at = ''
    }
}

function handleDeath(key) {
    removeAction(key);
    var behavior = getBehavior(key);
    if (behavior && behavior.handleDeath) {
        behavior.handleDeath(worldState, deaths[key].killerId);
    } else {
        removeObject(worldState.pub[key])
    }
    delete deaths[key];
}

function handleDeaths() {
    var keys = Object.keys(deaths);
    for (var key of keys) {
        var death = deaths[key];
        death.tick += 1;
        if (death.tick < 2) continue;
        handleDeath(key);
    }
}

export function sendAnnouncement(message) {
    for (var key in localState) {
        sendInfoTargetMessage(message, 'exclamation.svg', key, worldState)
    }
}

export function handleNextTick() {
    cleanUpEmptyInstances(worldState);
    clearAttackTargets();
    handleDeaths();
    updateFidelity(Object.keys(localState), worldState);
    updateBehaviors(worldState);
    handleActions();
    clearMessages();

    var diffs = {};
    for (var key in localState) {
        worldState.serv[key].tr -= 1;
        worldState.serv[key].tc += 1;
        if (worldState.serv[key].tc % 100 == 0) {
            Database.saveUserInfo({
                pub: worldState.pub[key],
                priv: worldState.priv[key],
                serv: worldState.serv[key],
            });
        }
        handleFidelityForUser(key, worldState);

        var oldLocalState = localState[key];
        var newLocalState = getLocalState(key);
        diffs[key] = getDiff(oldLocalState, newLocalState);
        localState[key] = newLocalState;
    }
    localState = structuredClone(localState);
    return diffs;
}

export function isTimedOut(key) {
    return worldState.serv[key] && worldState.serv[key].tr <= 0;
}

export function handleImmediate(key, action) {
    return action.handleImmediate(key, worldState);
}

// should only be used during initilization
export function getObjectsWithId(id) {
    var ids = [];
    for (var key in worldState.priv) {
        if (worldState.priv[key] && id == worldState.priv[key].id) {
            ids.push(key)
        }
    }
    return ids;
}