import { sendInfoTargetMessage } from './message.js';
import { definitions, levelToXpMap, skillToFieldMap } from './loader.js';
import * as WorldState from './world_state.js';
import { addToFirstInventorySlot, calculateCombatLevel, generateUUID } from './utils.js';
import { dropItem } from './action_utils.js';
import { addBehavior } from './behaviors.js';
import DespawnBehavior from './behaviors/despawn_behavior.js';

function increaseBaseLevel(skill, key, worldState) {
    if (skill == 'health') {
        worldState.pub[key]['mhp'] += 1;
        worldState.pub[key]['hp'] += 1;
        return;
    }
    worldState.priv[key][skillToFieldMap[skill][1]] += 1;
    worldState.priv[key][skillToFieldMap[skill][2]] += 1;
    if (skill == 'fidelity') {
        worldState.serv[key].tp += 100;
        if(worldState.priv[key]['kfl'] > 0) {
            worldState.pub[key].en = 0;
        }
    }
}

function decreaseBaseLevel(skill, key, worldState) {
    if (skill == 'health') {
        worldState.pub[key]['mhp'] -= 1;
        worldState.pub[key]['hp'] -= 1;
        return;
    }
    worldState.priv[key][skillToFieldMap[skill][1]] = Math.max(0, worldState.priv[key][skillToFieldMap[skill][1]] - 1);
    worldState.priv[key][skillToFieldMap[skill][2]] = Math.max(0, worldState.priv[key][skillToFieldMap[skill][2]] - 1);
    if (skill == 'fidelity') {
        worldState.serv[key].tp = Math.max(0, worldState.serv[key].tp - 100);
        if(worldState.priv[key]['kfl'] == 0) {
            worldState.pub[key].en = 1;
        }
    }
}

export function getBaseLevel(skill, key, worldState) {
    if (skill == 'health') {
        return worldState.pub[key]['mhp'];
    }
    return worldState.priv[key][skillToFieldMap[skill][1]];
}

export function getLevel(skill, key, worldState) {
    if (skill == 'health') {
        return worldState.pub[key]['hp'];
    }
    return worldState.priv[key][skillToFieldMap[skill][2]];
}

export function getXp(skill, key, worldState) {
    return worldState.priv[key][skillToFieldMap[skill][0]];
}


var hatMap = {
    'health': {
        result: 'red_hat',
        text: 'I found something on this monster.'
    },
    'fidelity': {
        result: 'white_hat',
        text: 'Something appeared from the sky.'
    },
    'forestry': {
        result: 'green_hat',
        text: 'I found something in the tree.'
    },
    'fishing': {
        result: 'blue_hat',
        text: 'I pulled something out of the water.'
    },
    'cooking': {
        result: 'orange_hat',
        text: 'Did this pop out of the fire?'
    },
    'crafting': {
        result: 'yellow_hat',
        text: 'Where did this come from?'
    },
    'mining': {
        result: 'black_hat',
        text: 'I found something inside the rock.'
    },
    'smithing': {
        result: 'silver_hat',
        text: 'Where did this come from?'
    },
    'farming': {
        result: 'brown_hat',
        text: 'I found something in the dirt.'
    },
}
function checkHat(skill, key, worldState) {
    if (Math.random() > 0.999999) {  // 1 in 1 million
        if (hatMap[skill]) {
            var result = hatMap[skill];
            if (!addToFirstInventorySlot(worldState.priv[key], definitions[result.result], 1)) {
                dropItem(result.result, 1, worldState.pub[key], worldState);
            }
            sendInfoTargetMessage(result.text, [result.result, 1], key, worldState);
            // add to collection log
            if (!worldState.serv[key].collection[result.result]) {
                worldState.serv[key].collection[result.result] = 0;
            }
            worldState.serv[key].collection[result.result] += 1;
        }
    }
}

export function gainXp(skill, amount, key, worldState, maxLevelForXp) {
    if (amount == 0) return;
    if (!WorldState.isLoggedIn(key)) return;
    var user = worldState.pub[key];
    var userPriv = worldState.priv[key];

    var currentLevel = getBaseLevel(skill, key, worldState);
    if (maxLevelForXp && maxLevelForXp <= currentLevel) {
        return;
    }

    checkHat(skill, key, worldState);

    userPriv[skillToFieldMap[skill][0]] = Math.min(
        userPriv[skillToFieldMap[skill][0]] + amount,
        Number.MAX_SAFE_INTEGER
    );
    var currentXp = userPriv[skillToFieldMap[skill][0]]
    var nextLevel = currentLevel + 1;
    while (currentXp >= levelToXpMap[nextLevel]) {
        increaseBaseLevel(skill, key, worldState);
        nextLevel += 1;
    }
    var newLevel = getBaseLevel(skill, key, worldState);
    if (currentLevel != newLevel) {
        worldState.pub[key].cbl = calculateCombatLevel(
            getBaseLevel('accuracy', key, worldState),
            getBaseLevel('strength', key, worldState),
            getBaseLevel('defense', key, worldState),
            getBaseLevel('health', key, worldState),
            getBaseLevel('archery', key, worldState),
        );
        sendInfoTargetMessage('Congratulations! Your ' + skill + ' level is now ' + newLevel + '.', skill + '.svg', key, worldState);
        var pub = {
            "t": "fireworks",
            "i": generateUUID(),
            "lsx": user.lsx,
            "lsy": user.lsy,
            "lx": user.lx,
            "ly": user.ly,
            "lr": user.lr,
            "lf": user.lf,
            "li": user.li,
            "sa": 0
        };
        var priv = { "id": "fireworks" };
        WorldState.addObject(pub, priv)
        addBehavior(new DespawnBehavior({ pub: pub, priv: priv }, {despawnTime: 1.2}));
    }
}

export function loseXp(skill, amount, key, worldState) {
    if (amount == 0) return;
    if (!WorldState.isLoggedIn(key)) return;
    var userPriv = worldState.priv[key];
    userPriv[skillToFieldMap[skill][0]] = Math.max(userPriv[skillToFieldMap[skill][0]] - amount, -100000000);
    var currentXp = userPriv[skillToFieldMap[skill][0]]
    var currentLevel = getBaseLevel(skill, key, worldState);
    var previousLevel = currentLevel;
    while (currentXp < levelToXpMap[previousLevel]) {
        decreaseBaseLevel(skill, key, worldState);
        previousLevel -= 1;
    }
    var newLevel = getBaseLevel(skill, key, worldState);
    if (currentLevel != newLevel) {
        worldState.pub[key].cbl = calculateCombatLevel(
            getBaseLevel('accuracy', key, worldState),
            getBaseLevel('strength', key, worldState),
            getBaseLevel('defense', key, worldState),
            getBaseLevel('health', key, worldState),
            getBaseLevel('archery', key, worldState),
        );
        sendInfoTargetMessage('Oh no! Your ' + skill + ' level is now ' + newLevel + '.', skill + '.svg', key, worldState);
        if (skill == 'fidelity' && newLevel == 0) {
            sendInfoTargetMessage('While your fidelity level is zero, other players can freely attack you!',  'fidelity.svg', key, worldState);
        }
    }
}