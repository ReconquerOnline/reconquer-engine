import Toolbar from './Toolbar.js';
import * as Communication from './Communication.js';
import * as Signals from './Signals.js';
import { getCharacter, Config, getCharacterId } from './Loader.js';
import { clearUseArray, inventory, UseArray } from './Inventory.js';
import { MainScene } from './Editor.js';
import { absolutePointToGridPoint, getObjectByDisplayName, getObjectByUUID, getObjectsByType } from './Utils.js';
import { getVerticalCollisions } from './Viewport.js';

var isPlaying = false;
var isRecording = false;
var startRecordingTime = 0;
var macroIndex = 0;

var macro = [];

var useArgs = ['uA', 'uB', 'uC', 'uD'];
var excludedActions = ['message', 'character_configure', 'change_name', 'examine', 'reset_acount', 'payment', 'block', 'toggle_chat', 'toggle_dlcr', 'toggle_graphics', 'toggle_macro', 'toggle_music', 'toggle_sfx', 'toggle_hroof']
var validInventoryArgs = {};
for (var i = 0; i < 24; i++) {
    validInventoryArgs['i' + i] = true;
}

export function handleAction(action) {
    if (!isRecording) return;
    if (excludedActions.indexOf(action.t) !== -1) return
    
    var extraInfo = {}
    var targetObject = getObjectByUUID(MainScene, action.ta);
    if (targetObject && targetObject.userData.type) {
        // mark typeof action.ta
        extraInfo.type = targetObject.userData.type;
    }

    if (validInventoryArgs[action.ta]) {
        var index = Number(action.ta.match(/\d+/)[0]);
        extraInfo.inventoryType = inventory[index].itemId[0]
    }
    
    for (var arg of useArgs) {
        if (validInventoryArgs[action[arg]]) {
            var index = Number(action[arg].match(/\d+/)[0]);
            extraInfo[arg] = inventory[index].itemId[0];
        }
    }
    macro.push({
        action: action,
        extraInfo: extraInfo
    });
}

export function recordMacro() {
    macro = [];
    startRecordingTime = Date.now();
    isRecording = true;
}

export function stopRecordingMacro() {
    isRecording = false;
    // save to local storage
    localStorage.setItem('macro-' + getCharacterId() + '_' + BUILD_VERSION, JSON.stringify(macro));

}

function playNextMacro() {
    if (!isPlaying) return;

    if (macroIndex >= macro.length) {
        macroIndex = 0;
    }

    var nextMacro = macro[macroIndex]
    var action = nextMacro.action;
    var extraInfo = nextMacro.extraInfo
    if (extraInfo.type && !getObjectByUUID(MainScene, action.ta)) {
        var character = getCharacter();
        var closest = null;
        var closestDistance = 10000;
        var objects = getObjectsByType(MainScene, extraInfo.type);
        for (var i = 0; i < objects.length; i++) {
            var distance = character.position.distanceTo(objects[i].position);
            if (distance < closestDistance) {
                closestDistance = distance;
                closest = objects[i].userData.uuid;
            }
        }
        if (closestDistance < 8) {
            action.ta = closest;
        }
    }
    if (extraInfo.inventoryType) {
        for (var i = 0; i < 24; i++) {
            if (inventory[i] && inventory[i].itemId && inventory[i].itemId[0] == extraInfo.inventoryType) {
                action.ta = 'i' + i;
                break;
            }
        }
    }
    var used = {};
    for (var arg of useArgs) {
        if (extraInfo[arg]) {
            for (var i = 0; i < 24; i++) {
                if (!used[i] && inventory[i] && inventory[i].itemId && inventory[i].itemId[0] == extraInfo[arg]) {
                    action[arg] = 'i' + i;
                    used[i] = true
                    break;
                }
            }
        }
    }
    Communication.update(action);
    macroIndex += 1;
}

export function playMacro() {
    isRecording = false;
    Communication.interact(null, { type: 'toggle_macro', interaction: 1 });
    isPlaying = true;
    macroIndex = 0;
    if (macro.length == 0) {
        Toolbar.setMessage(JSON.stringify([
            {t: 'You need to record yourself first.', ta: 'play.svg'}
        ]));
        return;
    }
    playNextMacro();
}

export function stopMacro() {
    Communication.interact(null, { type: 'toggle_macro', interaction: 0 });
    isPlaying = false;
}

//unused currently
export function clearMacro() {
    macro = [];
}

var queuedActions = [];
export function queueAction(uuid, interaction) {

    var useArrayCopy = [];
    if (interaction.type == 'on') {
        useArrayCopy = structuredClone(UseArray);
        clearUseArray();    
    }
    queuedActions.push({
        uuid: uuid,
        interaction: interaction,
        useArray: useArrayCopy
    });
}

var numIdleTicks = 0;
Signals.subscribe('newTick', function () {
    if (getCharacter() && getCharacter().userData.state.sa == 0) {
        numIdleTicks += 1;
        if (numIdleTicks == 1) return;
        if (queuedActions.length != 0) {
            var action = queuedActions.shift();
            Communication.interact(action.uuid, action.interaction, action.useArray);
        } else if (isPlaying && macro.length != 0) {
            playNextMacro();
        }
    } else {
        numIdleTicks = 0;
    }
});

Signals.subscribe('disconnect', function () {
    numIdleTicks = 0;
    queuedActions = [];
    clearMacro();
});

Signals.subscribe('handleLogin', function (msg) {
    
    // clear old macros
    for (const [key, value] of Object.entries(localStorage)) {
        if (key.startsWith('macro')) {
            var array = key.split('_');
            if (array.length < 1 || array[1] != BUILD_VERSION) {
                localStorage.removeItem(key);
            }
        }
    }
    // load in last macro from local storage
    var storedMacro = localStorage.getItem('macro-' + msg.i + '_' + BUILD_VERSION);
    if (storedMacro) {
        macro = JSON.parse(storedMacro);
    }
});