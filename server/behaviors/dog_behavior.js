import * as WorldState from '../world_state.js';
import MoveAction from '../actions/move_action.js';
import { sendCharacterMessage, sendNPCMessage } from '../message.js';
import { definitions } from '../loader.js';
import { removeAmountFromSlot } from '../utils.js';
import FollowAction from '../actions/follow_action.js';

export default class DogBehavior {
    constructor(item, config) {
        this.item = item;
        this.config = config;
    }
    update() {

        var currentAction = WorldState.getAction(this.item.pub.i);

        if (!currentAction && Math.random() > 0.85) {
            var distance = 10;

            var targetX = this.item.pub.lsx * 64 + this.item.pub.lx + Math.round((Math.random()-.5) * 2 * distance);
            var targetY = this.item.pub.lsy * 64 + this.item.pub.ly + Math.round((Math.random()-.5) * 2 * distance);
    
            WorldState.addAction(
                this.item.pub.i,
                new MoveAction({
                    segX: Math.floor(targetX / 64),
                    segY: Math.floor(targetY / 64),
                    x: targetX % 64,
                    y: targetY % 64
                })
            );
        }
    }
}

export function DogUseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    var firstItem = userPriv[slots[0]][0];
    var definition = definitions[firstItem];
    if (definition && definition.eatBehavior) {
        removeAmountFromSlot(slots[0], 1, userPriv);
        sendNPCMessage('Yum yum yum.', target, key, worldState);

        WorldState.addAction(
            target.i,
            new FollowAction({
                ta: key
            })
        );
    } else {
        sendCharacterMessage("He doesn't want to eat it.", key, worldState)
    }
    return;
}