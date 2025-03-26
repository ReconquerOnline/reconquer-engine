import { transportToPoint } from "../action_utils.js";
import { TargetDefeatHooks } from "../defeat_hooks.js";
import { definitions, setAnimation } from "../loader.js";
import { generateUUID, getCombatantsAtLocation, getEntitiesAtLocation, getItemsAtLocation } from "../utils.js";
import { addObject, removeObject } from "../world_state.js";
import * as WorldState from '../world_state.js';

var switches = ['lever.lightening1', 'lever.lightening2', 'lever.lightening3', 'lever.lightening4', 'lever.lightening5', 'lever.lightening6'];

function isBatteryEnabled(worldState) {
    return getItemsAtLocation({
        "lsx": 486,
        "lsy": 512,
        "lx": 46,
        "ly": 41,
        "lf": 0,
        "li": 0
    }, worldState, definitions).filter(o => o.t == 'zinc_ore').length &&
    getItemsAtLocation({
        "lsx": 486,
        "lsy": 512,
        "lx": 46,
        "ly": 42,
        "lf": 0,
        "li": 0
    }, worldState, definitions).filter(o => o.t == 'bucket_of_salt_water').length &&
    getItemsAtLocation({
        "lsx": 486,
        "lsy": 512,
        "lx": 46,
        "ly": 43,
        "lf": 0,
        "li": 0
    }, worldState, definitions).filter(o => o.t == 'copper_ore').length
}

var uuid = generateUUID();
var object = {
    "pub": {
        "t": "lightening",
        "i": uuid,
        "lsx": 486,
        "lsy": 512,
        "lx": 54,
        "ly": 41,
        "lr": 0,
        "lf": 0,
        "li": 0,
        "sa": 0
    },
    "priv": {
        "id": "lightening"
    }
};

export default class LighteningBehavior {
    constructor() {
        this.tick = 0;
        this.enabled = false;
    }
    update(worldState) {

        this.tick += 1;

        if (this.tick % 5 == 0) {
            if (isBatteryEnabled(worldState)) {
                this.enabled = true;
            } else {
                this.enabled = false;
            }
        }

        if (this.enabled) {
            // check if object exists
            if (!worldState.pub[uuid]) {
                addObject(object.pub, object.priv);
            }

            var count = 0;
            for (var i = 0; i < switches.length; i++) {
                var enabled = worldState.pub[worldState.ids[switches[i]]].ssw;
                count += enabled * Math.pow(2, i);
            }

            transportToPoint(worldState.pub[uuid], {
                "lsx": 486,
                "lsy": 512,
                "lx": 54 - count % 8,
                "ly": 41 + Math.floor(count / 8),
                "lr": 0,
                "lf": 0,
                "li": 0,
            }, worldState);

            if (this.tick % 2 == 0) return;

            var players = getCombatantsAtLocation(worldState.pub[uuid], worldState);
            players.forEach(x => {
                if (x.mhp && x.hp) {
                    x.hp -= 5;
                    if (x.hp < 0) x.hp = 0;
                    if (x.hp == 0) {
                        setAnimation(x, 'die');
                        WorldState.markDeath(x, 'Lightning');
                        if (TargetDefeatHooks[x.t]) {
                            TargetDefeatHooks[x.t](x.i, worldState);
                        }
                    }
                }
            });

        } else {
            if (worldState.pub[uuid]) {
                removeObject(worldState.pub[uuid])
            }
        }
    }
}