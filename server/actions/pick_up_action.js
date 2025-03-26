import { definitions, setAnimation } from "../loader.js";
import MoveAction from "./move_action.js";
import * as WorldState from '../world_state.js';
import { sendCharacterMessage } from '../message.js';
import { distanceBetween, angleTo, addToFirstInventorySlot } from "../utils.js";
import { moveToPoint } from "../action_utils.js";

export default class PickUpAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target) {
            setAnimation(user, 'idle');
            return false;
        }

        var definition = definitions[target.t]
        if (!definition || !definition.itemId) {
            setAnimation(user, 'idle');
            return false;
        }

        var targetDistance = 0;
        if (targetPriv && targetPriv.itemDistance) {
            targetDistance = targetPriv.itemDistance;
        }
        var distance = distanceBetween(user, target);
        if (distance > targetDistance) {
            return moveToPoint({
                squaredDistance: distance,
                point: {
                    x: target.lsx * 64 + target.lx,
                    y: target.lsy * 64 + target.ly
                }
            }, key, worldState);
        }

        if (distance > 0) {
            var targetAngle = angleTo(user, target);
            if (Math.abs(targetAngle - user.lr) > 0.5) {
                user.lr = targetAngle;
                setAnimation(user, 'turn');
                return true;
            }
        }
        setAnimation(user, 'idle');

        var quantity = target.q;
        if (addToFirstInventorySlot(userPriv, definition, quantity)) {
            WorldState.removeObject(target);
        } else {
            sendCharacterMessage('My inventory is full', key, worldState);
        }

        return false;

    }
}