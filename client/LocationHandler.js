import { MainScene } from './Editor.js';
import * as Loader from './Loader.js';
import * as Utils from './Utils.js';
import { Raycaster, Vector3 } from 'three';
import * as Signals from './Signals.js';

function getSegmentName(segmentX, segmentY) {
    return 'Seg-' + segmentX + '-' + segmentY;
}

function getSegmentsToDisplay(middleX, middleY) {
    return [
        getSegmentName(middleX - 1, middleY - 1),
        getSegmentName(middleX - 1, middleY),
        getSegmentName(middleX - 1, middleY + 1),
        getSegmentName(middleX, middleY - 1),
        getSegmentName(middleX, middleY),
        getSegmentName(middleX, middleY + 1),
        getSegmentName(middleX + 1, middleY - 1),
        getSegmentName(middleX + 1, middleY),
        getSegmentName(middleX + 1, middleY + 1)
    ];
}

var currentSegments = [];

export function clearCurrentSegments() {
    currentSegments = [];
}

function updateVisibleSegments(segmentX, segmentY, instance) {
    var oldSegments = JSON.parse(JSON.stringify(currentSegments));
    currentSegments = getSegmentsToDisplay(segmentX, segmentY);

    var removedSegments = oldSegments.filter(x => !currentSegments.includes(x));
    var addedSegments = currentSegments.filter(x => !oldSegments.includes(x));

    var diffs = [];
    for (var name of addedSegments) {
        var segment = Loader.Segments[name];
        if (segment) {
            segment.traverse((child) => {
                if (child.material && (child.material.name == 'FloorMaterial' || child.material.name == 'WaterMaterial')) return;
                child.receiveShadow = true;
            })
            MainScene.add(segment);
            Loader.Config.hierarchy[name].forEach(x => {
                if (instance != 0 && Loader.Config.definitions[x.t] && Loader.Config.definitions[x.t].viewableAtDistance) return;
                diffs.push({ 't': 'a', 'o': x, 'i': x.i, 'f': 1 })
            });
        }
    }
    for (var name of removedSegments) {
        var segment = Loader.Segments[name];
        if (segment) {
            MainScene.remove(segment);
            Loader.Config.hierarchy[name].forEach(x => diffs.push({ 't': 'r', 'i': x.i, 'f': 1 }));
        }
    }
    Signals.publish('beginLocationChange');
    Signals.publish('update', { d: diffs });
}

function getActualCoordinates(segX, segY, x, y) {
    var vector = new Vector3();
    vector.setX((segX - 500) * 64 + x - 32 + .5);
    vector.setZ(-(segY - 500) * 64 - y + 32 - .5);
    return vector;
}

export var cache = {};
function getActualCoordinatesWithY(segX, segY, x, y, floor, object) {
    var type = object.userData.type;

    if (!cache[type]) cache[type] = {};
    if (cache[type][segX + '-' + segY + '-' + x + '-' + y + '-' + floor] !== undefined) {
        return cache[type][segX + '-' + segY + '-' + x + '-' + y + '-' + floor].clone();
    }
    var vector = getActualCoordinates(segX, segY, x, y);

    var raycasters = [
        new Raycaster(new Vector3(vector.x + .25, 100, vector.z + .25), new Vector3(0, -1, 0)),
        new Raycaster(new Vector3(vector.x + .25, 100, vector.z - .25), new Vector3(0, -1, 0)),
        new Raycaster(new Vector3(vector.x - .25, 100, vector.z + .25), new Vector3(0, -1, 0)),
        new Raycaster(new Vector3(vector.x - .25, 100, vector.z - .25), new Vector3(0, -1, 0))
    ];
    var segmentName = getSegmentName(segX, segY);
    var segment = Loader.Segments[segmentName];
    var objects = Loader.getObjectsAffectingHeight(segX, segY, floor).filter(x => object.userData.uuid && x.userData.uuid != object.userData.uuid);
    var highest = raycasters.map(x => x.intersectObjects(objects.concat(segment)))
        .map(intersection => intersection.length > 0 ? intersection[0].point.y : -1000)
        .sort().reverse()[0];
    if (highest != null) {
        vector.setY(highest);
    } else {
        console.log('WARNING: No intersection %s, %s, %s, %s, %s', segX, segY, x, y, floor);
    }
    cache[type][segX + '-' + segY + '-' + x + '-' + y + '-' + floor] = vector.clone();

    return vector;
}

function getIntersectionAtLocation(segX, segY, x, y, floor) {
    var vector = getActualCoordinates(segX, segY, x, y);
    var raycaster = new Raycaster(new Vector3(vector.x, 100, vector.z), new Vector3(0, -1, 0));
    var segmentName = getSegmentName(segX, segY);
    var segment = Loader.Segments[segmentName];
    var objects = Loader.getObjectsAffectingHeight(segX, segY, floor);
    var intersection = raycaster.intersectObjects(objects.concat(segment));
    if (intersection.length > 0) {
        return intersection[0];
    }
}

function getDistanceBetween(segX, segY, x, y, segX2, segY2, x2, y2) {
    var coordinates1 = getActualCoordinates(segX, segY, x, y);
    var coordinates2 = getActualCoordinates(segX2, segY2, x2, y2);
    return coordinates1.distanceTo(coordinates2);
}

function isCharacterDeathAnimation(object) {
    if (object.userData.type != 'character') return;
    if (!object.userData.state || !object.userData.state.sa) return;
    var definition = Loader.Config.definitions[object.userData.type];
    var animation = definition.state.find(x => x.id == 'sa');
    return animation.options[object.userData.state.sa].name.endsWith('die');
}

export function handleLocationChange(object, actualState) {
    // also make sure these don't match already existing object userdata
    var changeSegmentX = actualState.lsx != undefined && actualState.lsx != object.userData.state.lsx;
    var changeSegmentY = actualState.lsy != undefined && actualState.lsy != object.userData.state.lsy;
    var changeX = actualState.lx != undefined && actualState.lx != object.userData.state.lx;
    var changeY = actualState.ly != undefined && actualState.ly != object.userData.state.ly;
    var changeR = actualState.lr != undefined && actualState.lr != object.userData.state.lr;
    var changeF = actualState.lf != undefined && actualState.lf != object.userData.state.lf;
    var changeI = actualState.li != undefined && actualState.li != object.userData.state.li;

    if (!changeSegmentX && !changeSegmentY && !changeX && !changeY && !changeR && !changeF && !changeI) {
        return;
    }

    var newSegmentX = changeSegmentX ? actualState.lsx : object.userData.state.lsx;
    var newSegmentY = changeSegmentY ? actualState.lsy : object.userData.state.lsy;
    var newX = changeX ? actualState.lx : object.userData.state.lx;
    var newY = changeY ? actualState.ly : object.userData.state.ly;
    var newR = changeR ? actualState.lr : object.userData.state.lr;
    var newF = changeF ? actualState.lf : object.userData.state.lf;
    var newI = changeI ? actualState.li : object.userData.state.li;

    // Handle things related to character moving
    if (object.userData.uuid == Loader.getCharacterId()) {
        Signals.publish('characterMove')
        if (changeSegmentX || changeSegmentY) {
            updateVisibleSegments(newSegmentX, newSegmentY, newI);
            Signals.publish('segmentChange', {x: newSegmentX, y: newSegmentY})
        }
    }

    var oldSegmentX = object.userData.state.lsx;
    var oldSegmentY = object.userData.state.lsy;
    var oldX = object.userData.state.lx;
    var oldY = object.userData.state.ly;

    var invalidCurrentState = (oldSegmentX == undefined);

    var floorToUse = (Loader.Config[object.userData.type] && Loader.Config.definitions[object.userData.type].affectsHeight) ? 0 : newF;

    // if the current state is invalid, or if the distance traveled is greater than 8 squares, or if the floor changes
    // transport this object to its spot, otherwise create interpolation animation

    if (invalidCurrentState ||
        getDistanceBetween(oldSegmentX, oldSegmentY, oldX, oldY, newSegmentX, newSegmentY, newX, newY) > 8 ||
        changeF ||
        isCharacterDeathAnimation(object)) {
        object.position.copy(getActualCoordinatesWithY(newSegmentX, newSegmentY, newX, newY, floorToUse, object));
        object.quaternion.copy(Utils.getQuaternionFromRotation(newR));
        object.userData.interpolation = null;
    } else {
        var endPosition = getActualCoordinatesWithY(newSegmentX, newSegmentY, newX, newY, floorToUse, object);
        object.userData.interpolation = {
            startPosition: object.position.clone(),
            endPosition: endPosition,
            startRotation: object.quaternion.clone(),
            endRotation: Utils.getQuaternionFromRotation(newR),
            len: 0.525,
            rotationLen: object.position.distanceTo(endPosition) > .1 ? 0.3 : 0.5
        }
    }

    var state = object.userData.state;

    state.lsx = newSegmentX;
    state.lsy = newSegmentY;
    state.lx = newX;
    state.ly = newY;
    state.lr = newR;
    state.lf = newF;
    state.li = newI;

    if (object.userData.uuid == Loader.getCharacterId()) { 
        //console.log('lsx:', state.lsx, 'lsy:', newSegmentY, 'lx', state.lx, 'ly', state.ly);
    }    
}

function updateVisibilityforOverlappingCharacters() {
    var characters = MainScene.children.filter(x => x.userData.type == 'character');
    var locationsMap = {};
    for (var char of characters) {
        var state = char.userData.state;
        var locationString = state.lsx + '-'
            + state.lsy + '-'
            + state.lx + '-'
            + state.ly + '-'
            + state.lf;
        if (!locationsMap[locationString]) {
            locationsMap[locationString] = [];
        }
        locationsMap[locationString].push(char);
    }
    var hidden = [];
    for (var locationString in locationsMap) {
        var chars = locationsMap[locationString];
        chars.sort(function (a, b) {
            if (a.userData.uuid == Loader.getCharacterId()) {
                return -1;
            } else if (b.userData.uuid == Loader.getCharacterId()) {
                return 1;
            }
            if (a.userData.uuid > b.userData.uuid) {
                return -1
            }
            return 1;
        });
        chars.forEach(function (char, i) {
            if (i != 0) {
                hidden.push(char.userData.uuid);
            }
        });
    }
    return hidden;
}

export function updateObjectVisibility(character) {
    var hidden = updateVisibilityforOverlappingCharacters();

    var state = character.userData.state;
    var hideRoofs = character.userData.state.hroof;
    var intersection = getIntersectionAtLocation(state.lsx, state.lsy, state.lx, state.ly, state.lf + 1);
    var isCovered = !intersection ? false : intersection.point.y > character.position.y + 1.5;

    if (intersection) {
        while (intersection.object && !intersection.object.userData.state) {
            intersection.object = intersection.object.parent
        }
        if (intersection.object) {
            var typeSplit = intersection.object.userData.type.split('_');
            typeSplit.pop();
            intersection.typePrefix = typeSplit.join('_');
        }
    }

    MainScene.traverse(function (object) {
        if (!object.userData.state) return;

        if ((isCovered && object.userData.state.lf > state.lf &&
            (object.userData.type.includes(intersection.typePrefix) || object.userData.state.pid && object.userData.state.pid.includes(intersection.typePrefix)))
            || hidden.indexOf(object.userData.uuid) != -1
            || (object.userData.state.lf > state.lf && hideRoofs)) {
            object.visible = false;
        } else {
            object.visible = true;
        }
    });

}