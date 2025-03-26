import { definitions, setAnimation } from './loader.js';
import MoveAction from "./actions/move_action.js";
import { canMoveToNextSquare } from "./actions/move_action.js";
import { getSquareString, generateUUID, getItemsAtLocation } from './utils.js';
import { removeDynamicCollision, addDynamicCollision } from './actions/move_action.js';
import * as WorldState from './world_state.js';
import { addBehavior } from './behaviors.js';
import DespawnBehavior from './behaviors/despawn_behavior.js';
import { validEquipmentArgs } from './inventory.js';
import { sendCharacterMessage } from './message.js';

// gets the extra distance objects can be apart based on dynamic collision size
export function getDynamicCollisionChange(pub) {
    var definition = definitions[pub.t];
    return definition && definition.dynamicCollisionSize ?
        (definition.dynamicCollisionSize - 1) / 2 : 0;
}

// gets coordinates of point rotated by angle with offset delta
export function getRotatedCoordinatedWithDelta(x, y, angle, deltaX, deltaY) {
    angle = angle * Math.PI / 2;
    return {
        x: x + deltaX * Math.cos(angle) + deltaY * Math.sin(angle),
        y: y + deltaY * Math.cos(angle) - deltaX * Math.sin(angle)
    }
}

// gets rounded coordinates of point rotated by angle with offset delta
export function getRoundedRotatedCoordinateWithDelta(x, y, angle, deltaX, deltaY) {
    var coord = getRotatedCoordinatedWithDelta(x, y, angle, deltaX, deltaY);
    return {
        x: Math.round(coord.x),
        y: Math.round(coord.y)
    };
}

// move within one square of target in x and y, then rotate within degrees if needed
function moveAndRotate(user, target, key, worldState, skipMove, nonBlockingRotation, degrees, movewithinOneSquare, ignoreFinalWallCollision) {
    // calculate center point of target including rotation
    var definition = definitions[target.t];
    var collisionX = 0;
    var collisionY = 0;
    if (definition && definition.staticCollisionBox) {
        collisionX = (definition.staticCollisionBox[0] - 1) / 2;
        collisionY = (definition.staticCollisionBox[1] - 1) / 2;
    }

    var angle = target.lr * Math.PI / 2;
    var deltaX = Math.cos(angle) * collisionX + Math.sin(angle) * collisionY;
    var deltaY = Math.cos(angle) * collisionY - Math.sin(angle) * collisionX;

    var userDynamicChange = getDynamicCollisionChange(user);
    var dynamicChange = getDynamicCollisionChange(target);

    // calculate distances
    var xDistance = (target.lsx - user.lsx) * 64 + target.lx - user.lx + deltaX;
    var yDistance = (target.lsy - user.lsy) * 64 + target.ly - user.ly + deltaY;

    var targetAbsoluteX = target.lsx * 64 + target.lx + deltaX;
    var targetAbsoluteY = target.lsy * 64 + target.ly + deltaY;
    var moveTarget = {
        segX: Math.floor(targetAbsoluteX / 64),
        segY: Math.floor(targetAbsoluteY / 64),
        x: Math.ceil(targetAbsoluteX % 64),
        y: Math.floor(targetAbsoluteY % 64)
    };

    // if further away than one square in either x or y, move closer
    if (!skipMove && (Math.abs(xDistance) > 1.01 + Math.abs(deltaX) + userDynamicChange + dynamicChange
        || Math.abs(yDistance) > 1.01 + Math.abs(deltaY) + userDynamicChange + dynamicChange
        || (movewithinOneSquare && Math.abs(xDistance) + Math.abs(yDistance) > 1.01 + Math.abs(deltaX) + Math.abs(deltaY) + userDynamicChange * 2 + dynamicChange * 2))) { 
        return new MoveAction(moveTarget, Math.max(1 + Math.sqrt(deltaX * deltaX + deltaY * deltaY), 1 + dynamicChange)).handleTick(key, worldState);
    }

    // make sure that you could walk to the next square, only looking at wall collisions
    var canMove = canMoveToNextSquare(user, moveTarget, true, 1);
    if (!ignoreFinalWallCollision && (!canMove || !canMove.canMoveX || !canMove.canMoveY)) {
        setAnimation(user, 'idle');
        return false;
    }

    var targetRotation = Math.atan2(xDistance, yDistance) * (2 / Math.PI) + 2;

    if (nonBlockingRotation) {
        user.lr = targetRotation
        return;
    }

    if ((xDistance != 0 ||
        yDistance != 0) &&
        Math.abs(targetRotation % 4 - user.lr % 4) > degrees / 90) {
        user.lr = targetRotation;
        setAnimation(user, 'turn');
        return true;
    }
}

export function moveAndRotateTowardsTarget(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, false, false, 22.5, false);
}

export function moveAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, false, false, 22.5, false, true);
}

export function moveWithinOneSquareAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, false, false, 22.5, true, true);
}

export function moveTowardsTarget(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, false, false, 360, false);
}

export function moveTowardsTargetWithNonBlockingRotation(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, false, true, null, false);
}

export function rotateTowardsTarget(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, true, false, 22.5, false);
}

export function rotateTowardsTargetNonBlocking(user, target, key, worldState) {
    return moveAndRotate(user, target, key, worldState, true, true, null, false, true);
}

export function getClosestPointAndDistance(points, x, y) {
    var distances = points.map(point =>
        (point.x - x) * (point.x - x) +
        (point.y - y) * (point.y - y)
    );
    var minDistanceIndex = distances.reduce((index, value, i, array) =>
        value < array[index] ? i : index, 0
    );
    return {
        point: points[minDistanceIndex],
        squaredDistance: distances[minDistanceIndex]
    }
}

export function moveToPoint(pointDistance, key, worldState) {
    if (pointDistance.squaredDistance >= 1) {
        return new MoveAction({
            segX: Math.floor(pointDistance.point.x / 64),
            segY: Math.floor(pointDistance.point.y / 64),
            x: pointDistance.point.x % 64,
            y: pointDistance.point.y % 64
        }).handleTick(key, worldState);
    }
}

export function transportToPoint(user, endLocation, worldState) {
    var oldSquareString = getSquareString(
        user.lsx,
        user.lsy,
        user.lx,
        user.ly);

    setAnimation(user, 'idle');

    if (definitions[user.t].dynamicCollisionSize) {
        removeDynamicCollision(user, definitions[user.t].dynamicCollisionSize);
    }

    user.lsx = endLocation.lsx;
    user.lsy = endLocation.lsy;
    user.lx = endLocation.lx;
    user.ly = endLocation.ly;
    user.lr = endLocation.lr;
    user.lf = endLocation.lf;
    user.li = endLocation.li;
    if (definitions[user.t].dynamicCollisionSize) {
        addDynamicCollision(user, definitions[user.t].dynamicCollisionSize);
    }

    var newSquareString = getSquareString(
        user.lsx,
        user.lsy,
        user.lx,
        user.ly);

    if (oldSquareString != newSquareString) {
        delete worldState.squares[oldSquareString][user.i];
        worldState.squares[newSquareString][user.i] = true;
    }
}

export function dropItem(type, quantity, location, worldState, obj, despawnConfig, priv) {

    if (!type) return;

    priv = priv ?? {};

    var items = getItemsAtLocation(location, worldState, definitions);
    for (var item of items) {
        WorldState.removeObject(item);
    }

    var obj = obj ? obj : {};

    obj.i = generateUUID();
    obj.t = type;
    obj.lsx = location.lsx;
    obj.lsy = location.lsy;
    obj.lx = location.lx;
    obj.ly = location.ly;
    obj.lf = location.lf;
    obj.li = location.li;
    obj.lr = 0;
    obj.q = quantity;

    var despawnConfig = despawnConfig ? despawnConfig : { despawnTime: 180 }

    WorldState.addObject(obj, priv);
    addBehavior(new DespawnBehavior({ pub: obj, priv: priv }, despawnConfig));
    return obj.i;
}

export function removeItem(slotString, pub, priv) {
    var itemId = priv[slotString];
    priv[slotString] = '';
    var definition = definitions[itemId];
    if (definition.wearBehavior) {
        for (var key in definition.wearBehavior.change) {
            pub[key] = 0;
            // set correctly if man vs woman
            if (pub.w && key == 'sl') { pub[key] = 3; }
            if (pub.w && key == 'ss') { pub[key] = 4; }
        }
    }
    if (slotString == 'ihe') {
        pub.sha = priv.zha;
        pub.sbe = priv.zbe;
    }
}

function getItemCount(userPriv) {
    var numItems = 0;
    for (var i = 0; i < 24; i++) {
        var itemId = userPriv['i' + i][0];
        if (itemId) { numItems += 1; }
    }
    for (var equip in validEquipmentArgs) {
        var itemId = userPriv[equip];
        if (itemId) { numItems += 1; }
    }
    return numItems;
}

export function removeSpecialItems(userPriv, uuid, worldState) {
    for (var i = 0; i < 24; i++) {
        var itemId = userPriv['i' + i][0];
        if (itemId && definitions[itemId]) {
            var definition = definitions[itemId];
            if (definition.removeOnDeath) {
                sendCharacterMessage('I lost my ' +  definitions[itemId].itemName.toLowerCase() + '.', uuid, worldState)
                userPriv['i' + i] = [];
            }
        }
    }
}

export function dropRandomItem(userPriv, userPub, worldState) {

    var numItems = getItemCount(userPriv);
    if (numItems == 0) return;

    var itemIndexToDrop = Math.floor(Math.random() * numItems);

    numItems = 0;
    for (var i = 0; i < 24; i++) {
        var itemId = userPriv['i' + i][0];
        var quantity = userPriv['i' + i][1];
        if (itemId) {
            if (numItems == itemIndexToDrop) {
                userPriv['i' + i] = [];
                dropItem(itemId, quantity, userPub, worldState);
                return itemId;
            }
            numItems += 1;
        }
    }
    for (var equip in validEquipmentArgs) {
        var itemId = userPriv[equip];
        if (itemId) {
            if (numItems == itemIndexToDrop) {
                removeItem(equip, userPub, userPriv);
                dropItem(itemId, 1, userPub, worldState);
                return itemId;
            }
            numItems += 1;
        }
    }
}

export function getFirstAmmoTypeFromInventory(userPriv, type) {
    for (var i = 0; i < 24; i++) {
        var item = userPriv['i' + i];
        if (!item) {
            continue;
        }
        var definition = definitions[item[0]];
        if (definition && definition.ammoParameters && definition.ammoParameters.type == type) {
            return 'i' + i;
        }
    }
}

export function removeAllItems(itemId, userPriv) {
    for (var i = 0; i < 24; i++) {
        var id = userPriv['i' + i][0];
        if (id == itemId) { userPriv['i' + i] = [] }
    }
}

export function updateEquipmentBonuses(userPriv) {
    userPriv.eacc = 0;
    userPriv.estr = 0;
    userPriv.edef = 0;
    userPriv.esld = 0;
    userPriv.estd = 0;
    userPriv.ecrd = 0;
    userPriv.eard = 0;
    for (var key in validEquipmentArgs) {
        if (userPriv[key]) {
            var wearBehavior = definitions[userPriv[key]].wearBehavior;
            wearBehavior.accuracy ? userPriv.eacc += wearBehavior.accuracy : null;
            wearBehavior.strength ? userPriv.estr += wearBehavior.strength : null;
            wearBehavior.defense ? userPriv.edef += wearBehavior.defense : null;
            wearBehavior.slashDefense ? userPriv.esld += wearBehavior.slashDefense : null;
            wearBehavior.strengthDefense ? userPriv.estd += wearBehavior.strengthDefense : null;
            wearBehavior.crushDefense ? userPriv.ecrd += wearBehavior.crushDefense : null;
            wearBehavior.archeryDefense ? userPriv.eard += wearBehavior.archeryDefense : null;
        }
    }
}
