import { Quaternion, Matrix4, Vector3 } from 'three'
import { extractFloor, lookupItemInMap } from './Utils.js';

var seed = 1;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

function handleChildren(children, config, assetsMap, configFiles, segment) {
    for (var child of children) {
        var originalId = child.getName();
        var fullId = originalId.replace(/\.\d\d\d$/g, '');
        if (fullId.includes('_collision') || fullId.includes('_attackcollision')) {
            continue;
        }
        if (!lookupItemInMap(fullId, assetsMap) && !lookupItemInMap(fullId, configFiles)) {
            continue;
        }
        var position = new Vector3().fromArray(child.getWorldTranslation());
        position.applyMatrix4(new Matrix4().fromArray(segment.getWorldMatrix()).invert());
        var modifiedTranslation = [
            Math.round(position.x * 2) / 2 + 32 - 0.5,
            Math.round(position.z * -1 * 2) / 2 + 32 - .5
        ];
        var rotation = child.getRotation();

        // lookup config
        var configEntry = lookupItemInMap(fullId, configFiles);

        // reverse rotation if needed
        if (configEntry && configEntry.reverseRotation) {
            var quaternion = new Quaternion().fromArray(rotation);
            var reverseRotation = new Quaternion().fromArray(configEntry.reverseRotation);
            quaternion.multiply(reverseRotation);
            rotation = quaternion.toArray();
        }

        var angle = 2 * Math.acos(rotation[3]) * 180 / Math.PI;
        angle = Math.round(angle / 45) * 45;
        if (rotation[1] > 0 && angle != 0 && angle != 180) angle += 180;
        angle = angle % 360;

        // make sure rotation is around Y axis
        if (angle != 0) {
            if (rotation[0] > .01 || rotation[2] > .01) {
                throw new Error('Object not rotated only along up axis: ' + originalId);
            }
        }

        var segName = segment.getName();
        var segmentX = Number(segName.split('-')[1]);
        var segmentY = Number(segName.split('-')[2]);

        var shortId = fullId.split('.')[0];

        var object = {};
        object.pub = {
            t: shortId,
            i: generateUUID(),
            lsx: segmentX,
            lsy: segmentY,
            lx: modifiedTranslation[0],
            ly: modifiedTranslation[1],
            lr: angle / 90,
            lf: extractFloor(originalId, child.getParent().getName()),
            li: 0
        };

        if (configEntry && configEntry.viewableAtDistance) {
            object.pub.pid = fullId; // set public id, used for hiding on higher floors
        }

        if (configEntry && configEntry.itemId) {
            object.pub.q = 1;
        }

        if (configEntry && configEntry.localInstance) {
            object.pub.id = fullId;
        }

        var serverState = configEntry &&
            configEntry.serverState &&
            configEntry.serverState[fullId] ? configEntry.serverState[fullId] : {};
        var serverPub = serverState.pub ? serverState.pub : {};
        var serverPriv = serverState.priv ? serverState.priv : {};

        object.priv = serverPriv;
        object.priv.id = fullId;

        for (var key in serverPub) {
            object.pub[key] = serverPub[key];
        }

        // set initial state
        if (configEntry && configEntry.state) {
            var state = configEntry.state;
            for (var option of state) {
                object.pub[option.id] = 0;
                if (serverPub[option.id] != undefined) {
                    object.pub[option.id] = serverState.pub[option.id];
                }
            }
        }
        if (serverPub.dn) {
            object.pub.dn = serverPub.dn;
        }
        if (serverPub.cid) {
            object.pub.cid = serverPub.cid;
        }
        config.push(object);

        handleChildren(child.listChildren(), config, assetsMap, configFiles, segment);
    }
}

function validateConfig(children, assetsMap, configFiles) {
    for (var child of children) {
        var asset = lookupItemInMap(child.priv.id, assetsMap);
        var config = lookupItemInMap(child.priv.id, configFiles)
        if (!asset && !config) {
            throw new Error('Could not find asset: ' + child.priv.id);
        }
        if (!asset && config) {
            if (!config.replaceMesh) {
                throw new Error('No replaceMesh listed for: ' + child.priv.id);
            }
            if (!lookupItemInMap(config.replaceMesh, assetsMap)) {
                throw new Error('replaceMesh points to non existing asset in ' + child.priv.id);
            }
        }
        if (config && config.behavior && config.behavior.dropTable) {
            var dropTables = config.behavior.dropTable;
            for (var table of dropTables) {
                var drops = table.flat().filter(x => typeof x == 'string');
                for (var drop of drops) {
                    if (!configFiles[drop]) {
                        throw new Error('Could not find drop in drop table. Drop: '+ drop + ' ItemName: ' + config.itemName);
                    }
                }
            }
        }
    }
}

function handleSegment(segment, assetsMap, configFiles) {
    var config = [];

    var children = segment.listChildren();
    handleChildren(children, config, assetsMap, configFiles, segment)

    // make sure every object in config has corresponding object in assetsMap
    validateConfig(config, assetsMap, configFiles);

    return config;
}

function GenerateSceneHierarchy(environment, assetsMap, configFiles) {
    var config = {};
    var segments = environment.getRoot().getDefaultScene().listChildren();
    for (var segment of segments) {
        var segConfig = handleSegment(segment, assetsMap, configFiles);
        config[segment.getName()] = segConfig;
    }
    return config;
}

export default GenerateSceneHierarchy;