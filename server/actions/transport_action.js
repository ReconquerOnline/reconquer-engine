import { moveToPoint, getClosestPointAndDistance, transportToPoint } from "../action_utils.js";
import { createInstance } from "../instance.js";
import { setAnimation } from '../loader.js';
import TransportOverrides from "../transport_overrides.js";

function convertConfigToPoint(point, target) {
    if (point.type == 'relative') {
        var absoluteTargetX = target.lsx * 64 + target.lx;
        var absoluteTargetY = target.lsy * 64 + target.ly;
        return {
            x: absoluteTargetX + point.deltaX,
            y: absoluteTargetY + point.deltaY,
            f: target.lf + point.deltaF,
            r: point.rotation,
        }
    } else if (point.type == 'absolute') {
        return {
            x: point.segX * 64 + point.x,
            y: point.segY * 64 + point.y,
            f: point.floor,
            r: point.rotation
        }
    }
}

export default class ClimbAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return (typeof msg.ta == 'string');
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];
        if (!target ||
            !targetPriv ||
            !targetPriv.startPoints ||
            !targetPriv.endPoint) {
            setAnimation(user, 'idle');
            return false;
        }

        var startPoints = targetPriv.startPoints.map(x => convertConfigToPoint(x, target));

        var absoluteUserX = user.lsx * 64 + user.lx;
        var absoluteUserY = user.lsy * 64 + user.ly;
        var closestPointAndDistance = getClosestPointAndDistance(startPoints, absoluteUserX, absoluteUserY);

        var persist = moveToPoint(closestPointAndDistance, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        // rotate to start point rotation
        if (closestPointAndDistance.point.r !== undefined && Math.abs(user.lr % 4 - closestPointAndDistance.point.r) >= .5) {
            user.lr = closestPointAndDistance.point.r;
            setAnimation(user, 'turn');
            return true;
        }

        if (TransportOverrides[targetPriv.id]) {
            var resume = TransportOverrides[targetPriv.id](key, worldState);
            if (!resume) {
                setAnimation(user, 'idle');
                return;
            }
        }

        var endPoint = convertConfigToPoint(targetPriv.endPoint, target);
        var endLocation = {
            lsx: Math.floor(endPoint.x / 64),
            lsy: Math.floor(endPoint.y / 64),
            lx: endPoint.x % 64,
            ly: endPoint.y % 64,
            lr: endPoint.r,
            lf: endPoint.f,
            li: 0
        };
        if (targetPriv.endPoint.instance) {
            endLocation.li = createInstance(user.i, [[endLocation.lsx, endLocation.lsy]]);
            worldState.serv[key].olsx = user.lsx;
            worldState.serv[key].olsy = user.lsy;
            worldState.serv[key].olx = user.lx;
            worldState.serv[key].oly = user.ly;
            worldState.serv[key].olr = user.lr;
            worldState.serv[key].olf = user.lf;
        }
        transportToPoint(user, endLocation, worldState);

        return false;
    }
}