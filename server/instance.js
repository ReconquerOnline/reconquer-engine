import { addBehavior, getBehavior, removeBehavior } from './behaviors.js';
import Behaviors from './behaviors.js';
import * as WorldState from './world_state.js';
import { hierarchy, definitions } from './loader.js';
import { generateUUID } from './utils.js';
import { removeInstance } from './actions/move_action.js';

var id = 10;

var instances = {}
export function createInstance(userId, segments) {
    id += 1;

    instances[id] = {
        objects: [],
        behaviors: [],
        users: [userId]
    };
    for (var i = 0; i < segments.length; i++) {
        var segmentXY = segments[i];
        var segmentName = 'Seg-' + segmentXY[0] + '-' + segmentXY[1];
        var segment = hierarchy[segmentName];

        for (var item of segment) {
            item = structuredClone(item);
            item.pub.li = id;
            item.pub.i = generateUUID();
            var config = definitions[item.pub.t];
            if (config && config.behavior) {
                var Behavior = Behaviors[config.behavior.type];
                var behaviorConfig = structuredClone(config.behavior);
                addBehavior(new Behavior(item, behaviorConfig));
                instances[id].behaviors.push(item.pub.i);
            }
            if (config && config.behaviors && config.behaviors[item.priv.id]) {
                var behaviorConfig = structuredClone(config.behaviors[item.priv.id]);
                var Behavior = Behaviors[behaviorConfig.type];
                addBehavior(new Behavior(item, behaviorConfig));
                instances[id].behaviors.push(item.pub.i);
            }
            WorldState.addObject(item.pub, item.priv);
            instances[id].objects.push(item.pub.i);
        }
    }
    return id;
}

export function getObjectsInInstance(instance) {
    if (instances[instance]) {
        return instances[instance].objects;
    }
    return [];
}

export function cleanUpEmptyInstances(worldState) {
    for (var key in instances) {
        var instance = instances[key];
        var populated = false;
        for (var user of instance.users) {
            if (worldState.pub[user] && worldState.pub[user].li == key) {
                populated = true;
            }
        }
        if (!populated) {
            for (var behavior of instance.behaviors) {
                removeBehavior(behavior);
            }
            for (var object of instance.objects) {
                if (worldState.pub[object]) {
                    WorldState.removeObject(worldState.pub[object])
                }
            }
            delete instances[key];
            removeInstance(key);
        }
    }
}