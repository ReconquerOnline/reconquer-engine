import fs from 'fs';
import path from 'path';

import { NodeIO } from '@gltf-transform/core';

import AssetLibraryPath from './AssetLibraryPath.js';

function fromDir(startPath, filter, callback) {
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            fromDir(filename, filter, callback);
        } else if (filter.test(filename)) callback(filename);
    }
}

function getIdFromPath(path, extension) {
    var split = path.split('/');
    var last = split[split.length - 1];
    return last.substring(0, last.length - extension.length);
}

function validateId(id) {
    return id == id.toLowerCase();
}

// Get all glb paths
var assets = [];
fromDir(AssetLibraryPath + 'library', /\.glb$/, function (path) {
    assets.push({
        id: getIdFromPath(path, '.glb'),
        glb_path: path
    });
});

// Load all glb nodes
const io = new NodeIO();
var glbDocs = await Promise.all(assets.map(obj => io.read(obj.glb_path)));
assets.map(function (obj, i) {
    obj.glb_doc = glbDocs[i];
});

// convert to map
var assetsMap = {};
for (var i = 0; i < assets.length; i++) {
    var id = assets[i].id;
    if (!validateId(id)) {
        throw new Error('GLB id not valid: ' + id);
    }
    if (assetsMap[id]) {
        throw new Error('Duplicate asset ids: ' + assets[i].id);
    }
    assetsMap[id] = assets[i];
}

function validateUniqueIds(config, path) {
    if (config.state) {
        var ids = {};
        var names = {};
        for (var element of config.state) {
            if (ids[element.id] != null) {
                throw new Error('Duplicate state id (' + element.id + ') in ' + path);
            }
            ids[element.id] = true;
            if (names[element.name] != null) {
                throw new Error('Duplicate state name (' + element.name + ') in ' + path);
            }
            names[element.name] = true;
        }
    }
}

function addInventoryInteraction(config) {
    if (!config.itemId) return;
    config.inventoryInteractions = config.inventoryInteractions ? config.inventoryInteractions : [];

    if (config.wearBehavior) {
        var interaction = ['iw', 'ith', 'ish'].includes(config.wearBehavior.slot) ? 'Wield' : 'Wear';
        config.inventoryInteractions.push({
            "type": "wear",
            "interaction": interaction
        });
    }
    if (config.eatBehavior) {
        var interactionName = config.eatBehavior.interactionName ? config.eatBehavior.interactionName : "Eat" 
        config.inventoryInteractions.unshift({
            "type": "eat",
            "interaction": interactionName
        });
    }
    if (config.inventoryInteractions[0] && config.inventoryInteractions[0].interaction == 'Empty') {
        config.inventoryInteractions.unshift({
            "type": "use",
            "interaction": "Use"
        });
    } else {
        config.inventoryInteractions.push({
            "type": "use",
            "interaction": "Use"
        });
    }
    config.inventoryInteractions.push({
        "type": "examine",
        "interaction": "Examine"
    });
    config.inventoryInteractions.push({
        "type": "drop",
        "interaction": "Drop"
    });
}

function addItemInteraction(config) {
    config.interactions = config.interactions ? config.interactions : [];
    if (config.itemId) {
        config.interactions.unshift({
            "type": "pick_up",
            "interaction": "Pick Up"
        });
    }
    if (config.behavior && config.behavior.type == "monster") {
        config.interactions.unshift({
            "type": "examine_monster",
            "interaction": "Examine"
        });
        config.interactions.unshift({
            "type": "attack",
            "interaction": "Attack"
        });
    }
    if (config.examineMatch || config.itemId) {
        config.interactions.push({
            "type": "examine",
            "interaction": "Examine"
        });
    }
}

function addUseSourceInteraction(config) {
    config.useSourceInteractions = config.useSourceInteractions ? config.useSourceInteractions : [];
    if (config.eatBehavior) {
        config.useSourceInteractions.push({
            type: "food_utility"
        })
    }
}

function addTargetSourceInteraction(config) {
    config.useTargetInteractions = config.useTargetInteractions ? config.useTargetInteractions : [];
    if (config.behavior && config.behavior.type == 'monster') {
        config.useTargetInteractions.push("food_utility");
    }
}

// Load in json config files
var configFiles = {};
fromDir(AssetLibraryPath + 'library', /\.json$/, function (path) {
    try {
        var config = JSON.parse(fs.readFileSync(path));

        var jsonId = getIdFromPath(path, '.json');
        if (!validateId(jsonId)) {
            throw new Error('Invalid jsonId: ' + jsonId);
        }
        if (configFiles[jsonId]) {
            throw new Error('Duplicate jsonId: ' + jsonId);
        }
        validateUniqueIds(config, path);
        addItemInteraction(config);
        addInventoryInteraction(config);
        addUseSourceInteraction(config);
        addTargetSourceInteraction(config);
        configFiles[jsonId] = config;

        if (assetsMap[jsonId]) {
            assetsMap[jsonId].config = config;
        }
    } catch (e) {
        console.log('Failed at path: ' + path)
        throw e;

    }
});

for (var jsonId in configFiles) {
    var configFile = configFiles[jsonId];
    if (configFile.useSourceInteractions) {
        for (var interaction of configFile.useSourceInteractions) {
            if (interaction.type == "cooking_utility" && interaction.success && interaction.failure) {
                var successConfig = configFiles[interaction.success];
                successConfig.useSourceInteractions.push({
                    "type": "cooking_utility",
                    "success": interaction.failure,
                    "failure": interaction.failure,
                    "experience": 0,
                    "level": 1
                });
            }
        }
    }
}

export { assetsMap as AssetsMap, configFiles as ConfigFiles };