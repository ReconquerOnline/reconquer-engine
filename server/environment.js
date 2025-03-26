import { addBehavior, getBehavior } from './behaviors.js';
import Behaviors from './behaviors.js';
import * as WorldState from './world_state.js';
import { setCollisionMaps } from './actions/move_action.js';
import { hierarchy, definitions, collisionMap, attackCollisionMap } from './loader.js';
import { publish } from './signals.js';

export function load() {
    setCollisionMaps(collisionMap, attackCollisionMap);

    for (var segName in hierarchy) {
        var segment = hierarchy[segName];

        for (var item of segment) {
            item = structuredClone(item);

            var config = definitions[item.pub.t];
            if (config && config.behavior) {
                var Behavior = Behaviors[config.behavior.type];
                addBehavior(new Behavior(item, config.behavior));
            }
            if (config && config.behaviors && config.behaviors[item.priv.id]) {
                var behaviorConfig = config.behaviors[item.priv.id];
                var Behavior = Behaviors[behaviorConfig.type];
                addBehavior(new Behavior(item, behaviorConfig));
            }
            if (item.priv && item.priv.shop) {
                getBehavior('shop').addShop(item);
            }
            try {
                WorldState.addObject(item.pub, item.priv);
            } catch (err) {
                console.log('ERROR. ITEM INFO: ', item.pub, item.priv)
                throw err;
            }
            
        }

    }
    publish('loaded')
}