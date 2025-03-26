import { setAnimation } from '../loader.js';
import { addDoorCollision, removeDoorCollision, checkDynamicCollision } from "./move_action.js";
import { getRotatedCoordinatedWithDelta, getRoundedRotatedCoordinateWithDelta, getClosestPointAndDistance, moveToPoint } from '../action_utils.js'
import { sendCharacterMessage } from '../message.js';
import * as WorldState from '../world_state.js';
export default class DoorAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return (typeof msg.ta == 'string');
    }
    handleTick(key, worldState) {
        // make sure target is a door
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target ||
            target.t != 'door') {
            setAnimation(user, 'idle');
            return false;
            }

        if (user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var absoluteUserX = user.lsx * 64 + user.lx;
        var absoluteUserY = user.lsy * 64 + user.ly;

        // calculate three target squares
        var absoluteTargetX = target.lsx * 64 + target.lx;
        var absoluteTargetY = target.lsy * 64 + target.ly;
        var angle = target.sd == 0 ? target.lr : target.lr - 1;

        var points = [
            getRoundedRotatedCoordinateWithDelta(absoluteTargetX, absoluteTargetY, angle, 0.5, -1.5),
            getRoundedRotatedCoordinateWithDelta(absoluteTargetX, absoluteTargetY, angle, 0.5, 0.5)
        ];
        var closestPointAndDistance = getClosestPointAndDistance(points, absoluteUserX, absoluteUserY);
        // move towards closest target square
        var persist = moveToPoint(closestPointAndDistance, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        // rotate towards door
        var rotationTarget = getRotatedCoordinatedWithDelta(absoluteTargetX, absoluteTargetY, angle, 0.5, 0);
        var targetRotation = Math.atan2(rotationTarget.x - absoluteUserX, rotationTarget.y - absoluteUserY) * (2 / Math.PI) + 2;
        if (Math.abs(targetRotation - user.lr) > .5) {
            user.lr = targetRotation;
            setAnimation(user, 'turn');
            return true;
        }
        setAnimation(user, 'idle');

        removeDoorCollision(target);
        if (target.sd == 0 && this.interaction == 'Open') {
            target.sd = 1;
            target.lr += 1;
        } else if (target.sd == 1 && this.interaction == 'Close') {
            target.sd = 0;
            target.lr -= 1;
        }

        if (this.interaction == 'Close') {
            if (Math.random() < 0.5) {
                user.hp -= 1;
                if (user.hp < 0) user.hp = 0;
                if (user.hp == 0) {
                    setAnimation(user, 'die');
                    WorldState.markDeath(user, 'Door');
                }
            }
        }

        addDoorCollision(target);
        return false;
    }
}