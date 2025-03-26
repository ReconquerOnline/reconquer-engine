import { prayerList } from "../loader.js";
import { getLevel, getBaseLevel } from "../skills.js";

var prayersById = {};
for (var prayer of prayerList) {
    prayersById[prayer.id] = prayer;
}


export default class TogglePrayerAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {
        var userPriv = worldState.priv[key];
        
        var prayerId = this.target;
        var enable = this.interaction;

        var prayer = prayersById[prayerId];
        if (!prayer) {
            return;
        }
        if (!enable) {
            userPriv.fid = userPriv.fid & (~Math.pow(2, prayer.id));
            return;
        }
        if (getBaseLevel('fidelity', key, worldState) < prayer.level) {
            return;
        }
        if (getLevel('fidelity', key, worldState) <= 0) {
            return;
        }
        // only allow one protection at a time
        if (prayer.id == 4) {
            userPriv.fid = userPriv.fid & (~Math.pow(2, 5));
            userPriv.fid = userPriv.fid & (~Math.pow(2, 6));
        } else if (prayer.id == 5) {
            userPriv.fid = userPriv.fid & (~Math.pow(2, 4));
            userPriv.fid = userPriv.fid & (~Math.pow(2, 6));
        } else if (prayer.id == 6) {
            userPriv.fid = userPriv.fid & (~Math.pow(2, 4));
            userPriv.fid = userPriv.fid & (~Math.pow(2, 5));
        }
        userPriv.fid = userPriv.fid | Math.pow(2, prayer.id);
    }
}