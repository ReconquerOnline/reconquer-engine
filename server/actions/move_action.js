import { getSquareString, sqrtDistanceBetween } from '../utils.js';
import { definitions, setAnimation } from '../loader.js';
import { isLoggedIn } from '../world_state.js';

var staticCollisionMap, staticAttackCollisionMap;
var dynamicCollisionMap = {};
var doorCollisionMap = {};
var dynamicInstanceCollisionMap = {};
var doorInstanceCollisionMap = {};
export function setCollisionMaps(collisionMap, attackCollisionMap) {
    staticCollisionMap = collisionMap;
    staticAttackCollisionMap = attackCollisionMap;
}

function handleDynamicCollision(info, collisionSize, delta) {
    if (!collisionSize) return;
    var min = -(collisionSize - 1) / 2;
    var max = (collisionSize - 1) / 2;
    for (var x = min; x <= max; x += 1) {
        for (var y = min; y <= max; y += 1) {
            var absoluteX = info.lsx * 64 + info.lx + x;
            var absoluteY = info.lsy * 64 + info.ly + y;
            if (info.li == 0) {
                if (!dynamicCollisionMap[absoluteX]) dynamicCollisionMap[absoluteX] = {}
                if (!dynamicCollisionMap[absoluteX][absoluteY]) dynamicCollisionMap[absoluteX][absoluteY] = {}
                if (!dynamicCollisionMap[absoluteX][absoluteY][info.lf]) dynamicCollisionMap[absoluteX][absoluteY][info.lf] = 0
                dynamicCollisionMap[absoluteX][absoluteY][info.lf] += delta;
            } else {
                if (!dynamicInstanceCollisionMap[info.li]) dynamicInstanceCollisionMap[info.li] = {};
                if (!dynamicInstanceCollisionMap[info.li][absoluteX]) dynamicInstanceCollisionMap[info.li][absoluteX] = {}
                if (!dynamicInstanceCollisionMap[info.li][absoluteX][absoluteY]) dynamicInstanceCollisionMap[info.li][absoluteX][absoluteY] = {}
                if (!dynamicInstanceCollisionMap[info.li][absoluteX][absoluteY][info.lf]) dynamicInstanceCollisionMap[info.li][absoluteX][absoluteY][info.lf] = 0
                dynamicInstanceCollisionMap[info.li][absoluteX][absoluteY][info.lf] += delta;
            }
        }
    }
}

export function removeInstance(li) {
    delete dynamicInstanceCollisionMap[li];
    delete doorInstanceCollisionMap[li];
}

export function addDynamicCollision(info, collisionSize) {
    handleDynamicCollision(info, collisionSize, 1);
}
export function removeDynamicCollision(info, collisionSize) {
    handleDynamicCollision(info, collisionSize, -1);
}

export function checkDynamicCollision(absoluteX, absoluteY, floor, instance) {
    if (instance == 0) {
        if (dynamicCollisionMap[absoluteX]
            && dynamicCollisionMap[absoluteX][absoluteY]
            && dynamicCollisionMap[absoluteX][absoluteY][floor]) {
            return true
        } else {
            return false;
        }
    } else {
        if (dynamicInstanceCollisionMap[instance]
            && dynamicInstanceCollisionMap[instance][absoluteX]
            && dynamicInstanceCollisionMap[instance][absoluteX][absoluteY]
            && dynamicInstanceCollisionMap[instance][absoluteX][absoluteY][floor]
        ) {
            return true;
        } else {
            return false;
        }
    }
}

function getCollision(map, x, y, floor, dir) {
    if (map[x]
        && map[x][y]
        && map[x][y][floor]
        && map[x][y][floor][dir]) {
        return 1
    } else {
        return 0;
    }
}
function getStaticCollision(x, y, floor, dir) {
    return getCollision(staticCollisionMap, x, y, floor, dir);
}
function getStaticAttackCollision(x, y, floor, dir) {
    return getCollision(staticAttackCollisionMap, x, y, floor, dir);
}
function getDoorCollision(x, y, floor, dir, instance) {
    if (instance == 0) {
        return getCollision(doorCollisionMap, x, y, floor, dir);
    } else {
        if (!doorInstanceCollisionMap[instance]) doorInstanceCollisionMap[instance] = {};
        return getCollision(doorInstanceCollisionMap[instance], x, y, floor, dir);
    }
}

export function checkStaticCollision(fromX, fromY, toX, toY, floor, instance) {
    var xDiff = toX - fromX;
    var yDiff = toY - fromY;

    var xDirection = Math.sign(xDiff);
    var yDirection = Math.sign(yDiff);

    var changeX = xDirection > 0 ? 1 : 0;
    var changeY = yDirection > 0 ? 1 : 0;

    var blocked = false;
    if (xDiff == 0) {
        blocked = blocked || getStaticCollision(fromX, fromY + changeY, floor, 0) || getDoorCollision(fromX, fromY + changeY, floor, 0, instance);
    }
    if (yDiff == 0) {
        blocked = blocked || getStaticCollision(fromX + changeX, fromY, floor, 1) || getDoorCollision(fromX + changeX, fromY, floor, 1, instance);
    }
    if (xDiff != 0 && yDiff != 0) {
        blocked = blocked || getStaticCollision(fromX + xDirection, fromY + changeY, floor, 0) || getDoorCollision(fromX + xDirection, fromY + changeY, floor, 0, instance);
        blocked = blocked || getStaticCollision(fromX + changeX, fromY + yDirection, floor, 1) || getDoorCollision(fromX + changeX, fromY + yDirection, floor, 1, instance);
    }
    return blocked;
}

function handleDoorCollision(info, value) {
    var absoluteX = info.lsx * 64 + info.lx;
    var absoluteY = info.lsy * 64 + info.ly;

    var deltaX = info.lr == 2 ? -1 : 0;
    var deltaY = info.lr == 1 ? -1 : 0;

    var x = Math.ceil(absoluteX) + deltaX;
    var y = Math.ceil(absoluteY) + deltaY;
    var f = info.lf;
    var r = info.lr % 2;

    if (info.li == 0) {
        if (!doorCollisionMap[x]) { doorCollisionMap[x] = {}; }
        if (!doorCollisionMap[x][y]) { doorCollisionMap[x][y] = {}; }
        if (!doorCollisionMap[x][y][f]) { doorCollisionMap[x][y][f] = {}; }
        doorCollisionMap[x][y][f][r] = value;
    } else {
        if (!doorInstanceCollisionMap[info.li]) doorInstanceCollisionMap[info.li] = {};
        if (!doorInstanceCollisionMap[info.li][x]) { doorInstanceCollisionMap[info.li][x] = {}; }
        if (!doorInstanceCollisionMap[info.li][x][y]) { doorInstanceCollisionMap[info.li][x][y] = {}; }
        if (!doorInstanceCollisionMap[info.li][x][y][f]) { doorInstanceCollisionMap[info.li][x][y][f] = {}; }
        doorInstanceCollisionMap[info.li][x][y][f][r] = value;
    }
}

export function addDoorCollision(info) {
    handleDoorCollision(info, 1);

}
export function removeDoorCollision(info) {
    handleDoorCollision(info, 0);
}

function checkAttackCollisionIntersectionVertical(x, y, f, instance) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    if (getStaticAttackCollision(fx, fy, f, 1) || getDoorCollision(fx, fy, f, 1, instance)) {
        return true;
    }
    // if y is exactly at corner, check other vertical edge
    if (Math.abs(fy - y) < .001 &&
        (getStaticAttackCollision(fx, fy - 1, f, 1) || getDoorCollision(fx, fy - 1, f, 1, instance))) {
        return true;
    }
}

function checkAttackCollisionIntersectionHorizontal(x, y, f, instance) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    if (getStaticAttackCollision(fx, fy, f, 0) || getDoorCollision(fx, fy, f, 0, instance)) {
        return true;
    }
    // if x is exactly at corner, check other horizontal edge
    if (Math.abs(fx - x) < .001 &&
        (getStaticAttackCollision(fx - 1, fy, f, 0) || getDoorCollision(fx - 1, fy, f, 0, instance))) {
        return true;
    }
}

export function checkAttackLineOfSite(object, target) {
    var objectX = object.lsx * 64 + object.lx + .5;
    var objectY = object.lsy * 64 + object.ly + .5;

    var targetX = target.lsx * 64 + target.lx + .5;
    var targetY = target.lsy * 64 + target.ly + .5;

    var xDiff = targetX - objectX;
    var yDiff = targetY - objectY;

    var m = (targetY - objectY) / (targetX - objectX);
    var b = objectY - m * objectX;

    if (xDiff > 0) {
        for (var x = Math.ceil(objectX + .01); x < targetX; x++) {
            var y = m * x + b;
            if (checkAttackCollisionIntersectionVertical(x, y, object.lf, object.li)) {
                return false;
            }
        }
    } else if (xDiff < 0) {
        for (var x = Math.floor(objectX - .01); x > targetX; x--) {
            var y = m * x + b;
            if (checkAttackCollisionIntersectionVertical(x, y, object.lf, object.li)) {
                return false;
            }
        }
    }

    m = (targetX - objectX) / (targetY - objectY);
    b = objectX - m * objectY;

    if (yDiff > 0) {
        for (var y = Math.ceil(objectY + .01); y < targetY; y++) {
            var x = y * m + b;
            if (checkAttackCollisionIntersectionHorizontal(x, y, object.lf, object.li)) {
                return false;
            }
        }
    } else if (yDiff < 0) {
        for (var y = Math.floor(objectY - .01); y > targetY; y--) {
            var x = y * m + b;
            if (checkAttackCollisionIntersectionHorizontal(x, y, object.lf, object.li)) {
                return false;
            }
        }
    }
    return true;
}

function checkCollisionIntersectionVertical(x, y, f, instance) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    if (getStaticCollision(fx, fy, f, 1) || getDoorCollision(fx, fy, f, 1, instance)) {
        return true;
    }
    // if y is exactly at corner, check other vertical edge
    if (Math.abs(fy - y) < .001 &&
        (getStaticCollision(fx, fy - 1, f, 1) || getDoorCollision(fx, fy - 1, f, 1, instance))) {
        return true;
    }
}

function checkCollisionIntersectionHorizontal(x, y, f, instance) {
    var fx = Math.floor(x);
    var fy = Math.floor(y);
    if (getStaticCollision(fx, fy, f, 0) || getDoorCollision(fx, fy, f, 0, instance)) {
        return true;
    }
    // if x is exactly at corner, check other horizontal edge
    if (Math.abs(fx - x) < .001 &&
        (getStaticCollision(fx - 1, fy, f, 0) || getDoorCollision(fx - 1, fy, f, 0, instance))) {
        return true;
    }
}

export function checkCollisionLineOfSite(object, target) {
    var objectX = object.lsx * 64 + object.lx + .5;
    var objectY = object.lsy * 64 + object.ly + .5;

    var targetX = target.lsx * 64 + target.lx + .5;
    var targetY = target.lsy * 64 + target.ly + .5;

    var xDiff = targetX - objectX;
    var yDiff = targetY - objectY;

    var m = (targetY - objectY) / (targetX - objectX);
    var b = objectY - m * objectX;

    if (xDiff > 0) {
        for (var x = Math.ceil(objectX + .01); x < targetX; x++) {
            var y = m * x + b;
            if (checkCollisionIntersectionVertical(x, y, object.lf, object.li)) {
                return false;
            }
        }
    } else if (xDiff < 0) {
        for (var x = Math.floor(objectX - .01); x > targetX; x--) {
            var y = m * x + b;
            if (checkCollisionIntersectionVertical(x, y, object.lf, object.li)) {
                return false;
            }
        }
    }

    m = (targetX - objectX) / (targetY - objectY);
    b = objectX - m * objectY;

    if (yDiff > 0) {
        for (var y = Math.ceil(objectY + .01); y < targetY; y++) {
            var x = y * m + b;
            if (checkCollisionIntersectionHorizontal(x, y, object.lf, object.li)) {
                return false;
            }
        }
    } else if (yDiff < 0) {
        for (var y = Math.floor(objectY - .01); y > targetY; y--) {
            var x = y * m + b;
            if (checkCollisionIntersectionHorizontal(x, y, object.lf, object.li)) {
                return false;
            }
        }
    }
    return true;
}


export function canMoveToNextSquare(object, target, ignoreDynamic, staticLimit) {
    var currentAbsoluteX = object.lsx * 64 + object.lx;
    var currentAbsoluteY = object.lsy * 64 + object.ly;

    var targetAbsoluteX = target.segX * 64 + target.x;
    var targetAbsoluteY = target.segY * 64 + target.y;

    var xDiff = targetAbsoluteX - currentAbsoluteX;
    var yDiff = targetAbsoluteY - currentAbsoluteY;

    var xDirection = Math.sign(xDiff);
    var yDirection = Math.sign(yDiff);

    var floor = object.lf;
    var changeX = xDirection > 0 ? 1 : 0;
    var changeY = yDirection > 0 ? 1 : 0;

    var moveX = true;
    var moveY = true;
    var moveXY = true;
    var moveYX = true;

    var collisionSize = definitions[object.t] && definitions[object.t].dynamicCollisionSize ? definitions[object.t].dynamicCollisionSize : 1;
    var min = -(collisionSize - 1) / 2;
    var max = (collisionSize - 1) / 2;
    var maxX = changeX ? max : min;
    var maxY = changeY ? max : min;


    // change static collisionmap
    for (var x = min; x <= max; x += 1) {
        moveY = moveY &&
            getStaticCollision(currentAbsoluteX + x, currentAbsoluteY + changeY + maxY, floor, 0) <= staticLimit &&
            getDoorCollision(currentAbsoluteX + x, currentAbsoluteY + changeY + maxY, floor, 0, object.li) == 0 &&
            (ignoreDynamic || !checkDynamicCollision(currentAbsoluteX + x, currentAbsoluteY + yDirection + maxY, floor, object.li));
        moveYX = moveYX &&
            getStaticCollision(currentAbsoluteX + changeX + x, currentAbsoluteY + yDirection + maxY, floor, 1) <= staticLimit &&
            getDoorCollision(currentAbsoluteX + changeX + x, currentAbsoluteY + yDirection + maxY, floor, 1, object.li) == 0;
    }

    for (var y = min; y <= max; y += 1) {
        moveX = moveX &&
            getStaticCollision(currentAbsoluteX + changeX + maxX, currentAbsoluteY + y, floor, 1) <= staticLimit &&
            getDoorCollision(currentAbsoluteX + changeX + maxX, currentAbsoluteY + y, floor, 1, object.li) == 0 &&
            (ignoreDynamic || !checkDynamicCollision(currentAbsoluteX + xDirection + maxX, currentAbsoluteY + y, floor, object.li));
        moveXY = moveXY &&
            getStaticCollision(currentAbsoluteX + xDirection + maxX, currentAbsoluteY + changeY + y, floor, 0) <= staticLimit &&
            getDoorCollision(currentAbsoluteX + xDirection + maxX, currentAbsoluteY + changeY + y, floor, 0, object.li) == 0;
    }

    var magnitudeX = Math.abs(targetAbsoluteX - currentAbsoluteX);
    var magnitudeY = Math.abs(targetAbsoluteY - currentAbsoluteY);

    // try to move diagonal, have to check four collisions and dynamic collsion
    if (xDirection != 0 &&
        yDirection != 0 &&
        moveX && moveXY && moveY && moveYX &&
        (ignoreDynamic || !checkDynamicCollision(currentAbsoluteX + xDirection + maxX, currentAbsoluteY + yDirection + maxY, floor, object.li))) {
        currentAbsoluteX += xDirection;
        currentAbsoluteY += yDirection;
    } else if (
        xDirection != 0 &&
        moveX &&
        (!moveY || (magnitudeX >= magnitudeY))) {
        yDirection = 0;
        currentAbsoluteX += xDirection;
    } else if (yDirection != 0 && moveY) {
        xDirection = 0;
        currentAbsoluteY += yDirection;
    } else {
        return false;
    }

    return {
        x: currentAbsoluteX,
        y: currentAbsoluteY,
        xDir: xDirection, // can be zeroed out if diagonal not possible
        yDir: yDirection, // can be zeroed out if diagonal not possible
        canMoveX: xDiff == 0 || moveX,
        canMoveY: yDiff == 0 || moveY
    }
}

// TODO, this could be improved to remove redundancy
function getAccessibleSquaresFromLocation(object) {
    var currentAbsoluteX = object.lsx * 64 + object.lx;
    var currentAbsoluteY = object.lsy * 64 + object.ly;

    var accessibleSquares = {};

    var squares = [];
    for (var i = 0; i < 4; i++) {
        var x = i < 2 ? 1 : -1;
        var y = i % 2 == 0 ? 1 : -1;
        var attempt = canMoveToNextSquare(object, {
            segX: Math.floor((currentAbsoluteX + x) / 64),
            segY: Math.floor((currentAbsoluteY + y) / 64),
            x: (currentAbsoluteX + x) % 64,
            y: (currentAbsoluteY + y) % 64
        }, false, 0);

        if (attempt.canMoveX) {
            if (!accessibleSquares[x + ' 0']) {
                squares.push({
                    lsx: Math.floor((currentAbsoluteX + x) / 64),
                    lsy: Math.floor(currentAbsoluteY / 64),
                    lx: (currentAbsoluteX + x) % 64,
                    ly: currentAbsoluteY % 64,
                    lf: object.lf,
                    li: object.li
                });
                accessibleSquares[x + ' 0'] = true;
            }

        }
        if (attempt.canMoveY) {
            if (!accessibleSquares['0 ' + y]) {
                squares.push({
                    lsx: Math.floor((currentAbsoluteX) / 64),
                    lsy: Math.floor((currentAbsoluteY + y) / 64),
                    lx: (currentAbsoluteX) % 64,
                    ly: (currentAbsoluteY + y) % 64,
                    lf: object.lf,
                    li: object.li
                });
                accessibleSquares['0 ' + y] = true;
            }

        }
        if (attempt.x == currentAbsoluteX + x && attempt.y == currentAbsoluteY + y) {
            if (!accessibleSquares[x + ' ' + y]) {
                squares.push({
                    lsx: Math.floor((currentAbsoluteX + x) / 64),
                    lsy: Math.floor((currentAbsoluteY + y) / 64),
                    lx: (currentAbsoluteX + x) % 64,
                    ly: (currentAbsoluteY + y) % 64,
                    lf: object.lf,
                    li: object.li
                });
                accessibleSquares[x + ' ' + y] = true;
            }

        }
    }
    return squares;
}

function lowestFScore(openSet, fScore) {
    let lowest = null;
    let lowestScore = Infinity;
    for (const node of openSet) {
        if (fScore[node] < lowestScore) {
            lowest = node;
            lowestScore = fScore[node];
        }
    }
    return lowest;
}
function reconstructPath(cameFrom, current) {
    const totalPath = [JSON.parse(current)];
    while (current in cameFrom) {
        current = cameFrom[current];
        totalPath.unshift(JSON.parse(current));
    }
    totalPath.shift();
    return totalPath;
}
function pathFind(object, target, pathDistance) {
    var startNode = {
        lsx: object.lsx,
        lsy: object.lsy,
        lx: object.lx,
        ly: object.ly,
        lf: object.lf,
        li: object.li
    }
    var endNode = {
        lsx: target.segX,
        lsy: target.segY,
        lx: target.x,
        ly: target.y,
        lf: object.lf,
        li: object.li
    }

    var openSet = new Set();
    var closedSet = new Set();
    var cameFrom = {};
  
    var gScore = {};
    var fScore = {};
  
    gScore[JSON.stringify(startNode)] = 0;
    fScore[JSON.stringify(startNode)] = sqrtDistanceBetween(startNode, endNode);
    openSet.add(JSON.stringify(startNode));

    var maxIterations = 80;
    var iteration = 0;
    while (openSet.size > 0 && iteration < maxIterations) {
        iteration += 1;
        var current = lowestFScore(openSet, fScore);
        var currentParsed = JSON.parse(current);
        openSet.delete(current);
        closedSet.add(current);
        if (sqrtDistanceBetween(currentParsed, endNode) <= pathDistance) {
            return reconstructPath(cameFrom, current);
        }

        for (var neighbor of getAccessibleSquaresFromLocation(currentParsed)) {
            var neighborString = JSON.stringify(neighbor);
            if (closedSet.has(neighborString)) continue;
    
            var tentativeGScore = gScore[current] + 1; // Assuming uniform cost edges
            if (!openSet.has(neighborString)) {
                openSet.add(neighborString);
            } else if (tentativeGScore >= gScore[neighborString]) {
                continue;
            }
    
            cameFrom[neighborString] = current;
            gScore[neighborString] = tentativeGScore;  
    
            fScore[neighborString] = gScore[neighborString] + sqrtDistanceBetween(neighbor, endNode);
        }
    }
    return [];
}

var trackedPaths = {};

export default class MoveAction {
    constructor(msg, pathDistance) {
        this.target = msg;
        this.pathDistance = pathDistance ? pathDistance : 0;
    }
    static validate(msg) {
        return Number.isInteger(msg.segX) &&
            Number.isInteger(msg.segY) &&
            Number.isInteger(msg.x) &&
            Number.isInteger(msg.y);
    }
    handleTick(key, worldState) {
        // remove ability to edit character after it has moved
        if (worldState.priv[key].zedit) { worldState.priv[key].zedit = 0; }
        // remove ability to bank after moved
        if (worldState.priv[key].msb) { worldState.priv[key].msb = 0; }

        var object = worldState.pub[key];

        var currentSegX = object.lsx;
        var currentSegY = object.lsy;
        var currentX = object.lx;
        var currentY = object.ly;

        if (currentSegX == this.target.segX
            && currentSegY == this.target.segY
            && currentX == this.target.x
            && currentY == this.target.y) {
            setAnimation(object, 'idle');
            return;
        }

        var canMove = false;
        if (isLoggedIn(object.i) && (!trackedPaths[object.i] || trackedPaths[object.i].target != JSON.stringify(this.target))) {
            var path = pathFind(object, this.target, this.pathDistance);
            trackedPaths[object.i] = { path: path, target: JSON.stringify(this.target) };
        }

        if (trackedPaths[object.i] && trackedPaths[object.i].path.length > 0) {
            canMove = canMoveToNextSquare(object, {
                segX: trackedPaths[object.i].path[0].lsx,
                segY: trackedPaths[object.i].path[0].lsy,
                x: trackedPaths[object.i].path[0].lx,
                y: trackedPaths[object.i].path[0].ly,
            }, false, 0);
            trackedPaths[object.i].path.shift()
        } else {
            canMove = canMoveToNextSquare(object, this.target, false, 0);
        }

        if (isLoggedIn(object.i) && !canMove) {
            var path = pathFind(object, this.target, this.pathDistance);
            if (path.length > 0) {
                trackedPaths[object.i].path = path;
                trackedPaths[object.i].target = JSON.stringify(this.target)
                canMove = {
                    x: path[0].lsx * 64 + path[0].lx,
                    y: path[0].lsy * 64 + path[0].ly,
                    xDir: (path[0].lsx * 64 + path[0].lx) - (currentSegX * 64 + currentX),
                    yDir: (path[0].lsy * 64 + path[0].ly) - (currentSegY * 64 + currentY)
                };
                trackedPaths[object.i].path.shift();
            }
        }
        
        if (!canMove) {
            setAnimation(object, 'idle');
            return false;
        }

        setAnimation(object, 'walk');

        var oldSquareString = getSquareString(
            currentSegX,
            currentSegY,
            currentX,
            currentY);

        object.lsx = Math.floor(canMove.x / 64);
        object.lsy = Math.floor(canMove.y / 64);
        object.lx = canMove.x % 64;
        object.ly = canMove.y % 64;
        object.lr = Math.atan2(canMove.xDir, canMove.yDir) * (2 / Math.PI) + 2;

        var collisionSize = definitions[object.t] && definitions[object.t].dynamicCollisionSize ? definitions[object.t].dynamicCollisionSize : 1;

        if (definitions[object.t] && definitions[object.t].dynamicCollisionSize) {
            removeDynamicCollision({
                lsx: currentSegX,
                lsy: currentSegY,
                lx: currentX,
                ly: currentY,
                lf: object.lf,
                li: object.li
            }, collisionSize);
            addDynamicCollision(object, collisionSize);
        }

        var newSquareString = getSquareString(
            object.lsx,
            object.lsy,
            object.lx,
            object.ly);

        if (oldSquareString != newSquareString) {
            delete worldState.squares[oldSquareString][key];
            worldState.squares[newSquareString][key] = true;
        }
        return true;
    }
}