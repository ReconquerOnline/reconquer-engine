import { getAnimationName, setAnimation } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { getObjectsInInstance } from "../instance.js";
import { addDoorCollision, removeDoorCollision } from "./move_action.js";
import { getBehavior } from "../behaviors.js";
import { FightArenaToggleHandler } from "../quests/q009_fight_arena.js";

var levelIdToHandlerMap = {
    "lever.fight_arena": FightArenaToggleHandler
}

// for instanced doors
var leverIdToDoorMap = {
    "lever.499-506a": ["door_custom.499-506a", "door_custom.499-506b"],
    "lever.499-506b": ["door_custom.499-506f"],
    "lever.499-506c": ["door_custom.499-506a", "door_custom.499-506d"],
    "lever.499-506d": ["door_custom.499-506f", "door_custom.499-506g"],
    "lever.499-506e": ["door_custom.499-506b", "door_custom.499-506e"],

    "lever.501-506a": ["door_custom.501-506a", "door_custom.501-506d"],
    "lever.501-506b": ["door_custom.501-506c", "door_custom.501-506d"],
    "lever.501-506c": ["door_custom.501-506a", "door_custom.501-506b"],
    "lever.501-506d": ["door_custom.501-506a", "door_custom.501-506e"],
    "lever.501-506e": ["door_custom.501-506a", "door_custom.501-506c"],
    "lever.501-506f": ["door_custom.501-506c"],
    // solution : [ 0, 1, 2, 4, 5, 0, 3 ]


    "lever.496-489a": ["door_custom.496-489f"],
    "lever.496-489b": ["door_custom.496-489b"],
    "lever.496-489c": ["door_custom.496-489a", "door_custom.496-489f"],
    "lever.496-489d": ["door_custom.496-489a", "door_custom.496-489e"],
    "lever.496-489e": ["door_custom.496-489b", "door_custom.496-489g"],
    "lever.496-489f": ["door_custom.496-489d","door_custom.496-489f"],
    "lever.496-489g": ["door_custom.496-489a","door_custom.496-489c"],
    "lever.496-489h": ["door_custom.496-489e","door_custom.496-489f"],
    "lever.496-489i": ["door_custom.496-489a","door_custom.496-489d"],
    "lever.496-489j": ["door_custom.496-489b", "door_custom.496-489f"],
    "lever.496-489k": ["door_custom.496-489a", "door_custom.496-489b"],
    //solution: [0, 1, 4, 10, 0, 2, 3, 4, 8, 10, 2, 6, 5, 4, 8, 10]
}

var leverIdToSpoutMap = {
    "lever.building_den_floor1a": ["fire_spout.building_den_e", "fire_spout.building_den_g"],
    "lever.building_den_floor1b": ["fire_spout.building_den_d"],
    "lever.building_den_floor1c": ["fire_spout.building_den_c", "fire_spout.building_den_f"],
    "lever.building_den_floor1d": ["fire_spout.building_den_a", "fire_spout.building_den_b"]
}

function toggleDoors(doors, instance, worldState) {
    var objects = getObjectsInInstance(instance);
    for (var key of objects) {
        if (worldState.priv[key] && doors.indexOf(worldState.priv[key].id) != -1) {
            var target = worldState.pub[key];
            var targetPriv = worldState.priv[key];
            removeDoorCollision(target);
            if (!targetPriv.stateDoor) {
                targetPriv.stateDoor = 1;
                target.lr += 1;
            } else {
                targetPriv.stateDoor = 0;
                target.lr -= 1;
            }
            addDoorCollision(target);
        }
    }
}

function toggleSpouts(spouts, worldState) {
    for (var id of spouts) {
        var uuid = worldState.ids[id];
        var behavior = getBehavior(uuid);
        behavior.enable();
    }
}

export default class ToggleAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target || target.t !== 'lever'
            || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        setAnimation(user, 'pick');

        this.tick += 1;
        if (this.tick == 2) {
            setAnimation(user, 'idle');

            if (leverIdToDoorMap[targetPriv.id]) { // currently assumes instance
                toggleDoors(leverIdToDoorMap[targetPriv.id], user.li, worldState)
            } else if (leverIdToSpoutMap[targetPriv.id]) { // currently assumes not instance
                toggleSpouts(leverIdToSpoutMap[targetPriv.id], worldState);
            } else if (levelIdToHandlerMap[targetPriv.id]) {
                levelIdToHandlerMap[targetPriv.id](key, this.target, worldState);
                return false;
            }

            if (!target.ssw) {
                target.ssw = 1;
            } else {
                target.ssw = 0;
            }
            return false;
        }
        return true;
    }
}