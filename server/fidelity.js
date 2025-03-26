import { prayerList } from "./loader.js"

// iterate through every possible prayer combination
var fidelityToDrainRate = {}
var prayerCombinations = Math.pow(2, prayerList.length)
for (var i = 0; i < prayerCombinations; i++) {
    fidelityToDrainRate[i] = 0;
    for (var j = 0; j < prayerList.length; j++) {
        var prayer = prayerList[j];
        if (i & Math.pow(2, prayer.id)) {
            fidelityToDrainRate[i] += prayer.drainRate;
        }
    }
}
export function handleFidelityForUser(key, worldState) {
    // drain fidelity as needed
    if (worldState.priv[key].fid) {
        worldState.serv[key].tp = Math.max(0, worldState.serv[key].tp - fidelityToDrainRate[worldState.priv[key].fid]);
    }
    worldState.priv[key].kfc = Math.ceil(worldState.serv[key].tp / 100);
    if (worldState.priv[key].kfc == 0) {
        worldState.priv[key].fid = 0;
    }
}

var fidelityNameToPrayer = {};
for (var i = 0; i < prayerList.length; i++) {
    var prayer = prayerList[i];
    fidelityNameToPrayer[prayer.nameId] = prayer;
}

export function isPrayerEnabled(key, worldState, nameId) {
    return worldState.priv[key].fid
        && (worldState.priv[key].fid & Math.pow(2, fidelityNameToPrayer[nameId].id));
}

export function updateFidelity(users, worldState) {
    var heal = Math.random() < (1 / 50);
    if (heal) {
        for (var key of users) {
            if (isPrayerEnabled(key, worldState, 'healMe')) {
                worldState.pub[key].hp = Math.min(worldState.pub[key].hp + 1, worldState.pub[key].mhp);
            }
        }
    }
}