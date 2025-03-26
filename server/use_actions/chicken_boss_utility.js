import Behaviors, { addBehavior, removeBehavior } from '../behaviors.js';
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { generateUUID, getTotalQuantityOfItemInInventory, removeAmountFromInventory } from "../utils.js";
import * as WorldState from '../world_state.js';

var uuid = generateUUID();

export default class ChickenBossUtility {
    constructor(target, items, interaction) {
        this.target = target;
        this.items = items;
        this.ticks = 0;
        this.interaction = interaction;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        setAnimation(user, 'pick');
        this.ticks += 1;
        if (this.ticks == 3) {
            if (worldState.pub[uuid]) {
                sendInfoTargetMessage('The coop is already open', this.target.i, key, worldState)
                setAnimation(user, 'idle');
                return;
            }

            if (getTotalQuantityOfItemInInventory('coop_key', userPriv) > 0) {
                removeAmountFromInventory('coop_key', 1, userPriv);
                sendInfoTargetMessage('Bawk bawk bwak!', uuid, key, worldState)
                setAnimation(user, 'idle');
                this.uuid = generateUUID();

                var item = {
                    pub: {
                        "t": "chicken_boss",
                        "i": uuid,
                        "lsx": 486,
                        "lsy": 510,
                        "lx": 36,
                        "ly": 37,
                        "lr": 0,
                        "lf": 0,
                        "li": 0,
                        "sa": 0
                    },
                    priv: {
                        "i0": ["egg_ball", 999999999],
                        "iw": "wooden_longbow",
                        "id": "chicken_boss"
                    }
                };

                WorldState.addObject(item.pub, item.priv);
                var config = definitions['chicken_boss'];
                var behaviorConfig = structuredClone(config.behavior);
                behaviorConfig.respawn = false;
                var Behavior = Behaviors[behaviorConfig.type];
                addBehavior(new Behavior(item, behaviorConfig));
            }
            return false;
        }
        return true;
    }
}