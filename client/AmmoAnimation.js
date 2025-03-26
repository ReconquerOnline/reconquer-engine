import * as Utils from './Utils.js';
import * as Signals from './Signals.js';
import * as Loader from './Loader.js';
import { getObjectByUUID, getSpriteHeight } from './Utils.js';
import { Quaternion, Vector3 } from 'three';
import { MainScene } from './Editor.js';

export function handleUpdate(object, value) {
    var attackTarget = value.split(',');
    var target = attackTarget[0];
    var ammo = attackTarget[1];
    var uuid = Utils.generateUUID();
    // manually calculate start and end locations
    var startMesh = getObjectByUUID(MainScene, object.userData.uuid);
    if (!startMesh) return;
    var startPosition = startMesh.position.clone();
    var ammoOffset = objectToAmmoOffset[startMesh.userData.uuid];
    if (ammoOffset) {
        startPosition.add(new Vector3().fromArray(ammoOffset).applyQuaternion(startMesh.quaternion));
    } else {
        startPosition.add(new Vector3(0, getSpriteHeight(startMesh.userData.type) * .75, 0));
    }


    var endMesh = getObjectByUUID(MainScene, target);
    if (!endMesh) return;
    var endPosition = endMesh.position.clone().add(new Vector3(0, getSpriteHeight(endMesh.userData.type) * .5, 0));
    var distance = startPosition.distanceTo(endPosition);

    // add new ammo mesh to scene
    Signals.publish('update', {
        d: [{
            'o': {
                t: ammo,
                i: uuid,
                q: 1
            },
            't': 'a',
            'i': uuid
        }]
    });
    var rotationOffset = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * 5 / 4);
    var rotation = startMesh.quaternion.clone().multiply(rotationOffset);
    setTimeout(() => {
        var ammoMesh = getObjectByUUID(MainScene, uuid);
        ammoMesh.userData.interpolation = {
            len: Math.min(Math.max(distance * .15, 0.2), .6), // set the len based on distance to travel
            startPosition: startPosition, // increase to the right y value
            endPosition: endPosition, // increase to correct y value
            startRotation: rotation,
            endRotation: rotation,
            callback: function () {
                // can't remove it until after the interpolation traversal
                setTimeout(() => { Signals.publish('update', { d: [{ 't': 'r', 'i': uuid }] }) }, 0);
            }
        }
    }, 0);
}

var objectToAmmoOffset = {};
Signals.subscribe('animationChange', function (change) {
    var object = change.object;
    var option = change.option;
    objectToAmmoOffset[object.userData.uuid] = option.ammoOffset;
})