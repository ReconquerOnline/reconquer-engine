import { MainScene } from './Editor.js';
import * as Loader from './Loader.js';
import * as Signals from './Signals.js';
import { applyConfig } from './StateHandler.js';
import { getObjectByCid, getObjectByUUID } from './Utils.js';

var cidOverrides = {};

export function handleUpdate(object, state) {

    // handle initial creating of local instance
    var character = Loader.getCharacter();
    if (state.id && character) {
        var actualState = {};
        var configState;
        for (var localInstanceParameter in Loader.LocalInstanceParameters) {
            var uniqueId = Loader.LocalInstanceParameters[localInstanceParameter].uniqueId;
            var stateId = Loader.LocalInstanceParameters[localInstanceParameter].stateId;
            if (uniqueId == state.id) {
                actualState[stateId] = character.userData.state[localInstanceParameter];
                configState = Loader.Config.definitions[object.userData.type].state;
            }
        }
        applyConfig(object, configState, actualState)
    }

    // keep list of user cid states, ie cid.Gardener.she
    // when creating item, look at cid and set to that param
    // when that param updates, search by cid, and find it
    if (state.cid) {
        object.userData.cid = state.cid;
        if (cidOverrides[state.cid]) {
            var configState = Loader.Config.definitions[object.userData.type].state;
            var configCopy = configState.filter((x) => {
                return cidOverrides[state.cid][x.id] !== undefined;
            })
            applyConfig(object, configCopy, cidOverrides[state.cid])
        }
    }
    
    // handle parameters change on character
    if (object.userData.uuid !== Loader.getCharacterId()) return;

    for (var key in state) {
        if (key.startsWith('cid.')) {
            var cid = key.split('.')[1];
            var parameter = key.split('.')[2];
            var value = state[key];
            if (!cidOverrides[cid]) cidOverrides[cid] = {};
            cidOverrides[cid][parameter] = value;
            var cidObject = getObjectByCid(MainScene, cid);
            if (cidObject) {
                var configState = Loader.Config.definitions[cidObject.userData.type].state;
                var configCopy = configState.filter((x) => {
                    return cidOverrides[cid][x.id] !== undefined;
                })
                applyConfig(cidObject, configCopy, cidOverrides[cid]);
            }
        }
    }

    var diffs = [];
    // check localInstance values and update appropriately
    for (var localInstanceParameter in Loader.LocalInstanceParameters) {
        var uniqueId = Loader.LocalInstanceParameters[localInstanceParameter].uniqueId;
        var stateId = Loader.LocalInstanceParameters[localInstanceParameter].stateId;
        if (state[localInstanceParameter] !== undefined) {
            object.userData.state[localInstanceParameter] = state[localInstanceParameter];
            var uuid = Loader.LocalInstanceToUUID[uniqueId];
            if (!uuid || !getObjectByUUID(MainScene, uuid)) continue;
            var o = {};
            o[stateId] = state[localInstanceParameter];
            diffs.push({ 't': 'c', 'o': o, 'i': uuid });
        }
    }


    if (diffs.length > 0) {
        Signals.publish('update', { d: diffs });
    }
}