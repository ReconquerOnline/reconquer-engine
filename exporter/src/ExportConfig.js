import fs from 'fs';
import OutputPath from './OutputPath.js';
import path from 'path';
import zlib from 'zlib';

import { names, adjectives, badWords } from './Names.js';
import { segmentToPVPMultiplier, spawnPoints, segmentToSpawnPoints, segmentToSongs, segmentToBackgroundColor, forceSongChanges } from './SegmentInfo.js';
import { levelToXpMap, skillToFieldMap, materialToSuccessChanceMap, materialToLevelMap, materialToXPMap, characterTypeOptions, characterColorOptions, prayerList, questList, collectionLog } from './ConfigInfo.js';


function stripConfig(configs) {
    for (var id in configs) {
        var object = configs[id];
        delete object["reverseRotation"];
        delete object["removeMeshes"];
    }
    return configs;
}

function stripClientConfig(clientConfig) {
    for (var id in clientConfig) {
        var object = clientConfig[id];
        delete object["serverState"];
        delete object["viewableAtDistance"];
        delete object["behavior"];
        delete object["behaviors"];
        delete object["dynamicCollisionSize"];
        delete object["staticCollisionBox"];
        delete object["examineMatch"];
        delete object["eatBehavior"];
        delete object["price"];
        delete object["unsellable"];
        delete object["useTargetInteractions"];
        delete object["useSourceInteractions"];
        delete object["isItem"];
        delete object["attackParameters"];
        delete object["localInstance"];
        delete object["despawnConfig"];
        delete object["maxLevelForXp"];
    }
    return clientConfig;
}

function stripClientHierarchy(hierarchy, config) {
    // remove all objects that aren't listed as "viewableAtDistance" or "localInstance"
    // assign UUID to both this item and corresponding item in server config
    for (var key in hierarchy) {
        var segment = hierarchy[key];
        for (var i = 0; i < segment.length; i++) {
            segment[i] = segment[i].pub;
            var shortId = segment[i].t;
            if (!config[shortId] || (!config[shortId].viewableAtDistance && !config[shortId].localInstance)) {
                segment.splice(i, 1);
                i--;
            }
        }
    }
    return hierarchy;
}

function ExportConfig(configHierarchy, configFiles, collisionMap, attackCollisionMap) {

    var strippedConfig = stripConfig(configFiles);

    fs.writeFileSync(path.join(OutputPath, 'server', 'config.json'), JSON.stringify({
        hierarchy: configHierarchy,
        definitions: strippedConfig,
        collisionMap: collisionMap,
        attackCollisionMap: attackCollisionMap,
        levelToXpMap: levelToXpMap,
        skillToFieldMap: skillToFieldMap,
        materialToSuccessChanceMap: materialToSuccessChanceMap,
        materialToLevelMap: materialToLevelMap,
        materialToXPMap: materialToXPMap,
        characterColorOptions: characterColorOptions,
        characterTypeOptions: characterTypeOptions,
        names: names,
        adjectives: adjectives,
        prayerList: prayerList,
        segmentToPVPMultiplier: segmentToPVPMultiplier,
        spawnPoints: spawnPoints,
        segmentToSpawnPoints: segmentToSpawnPoints
    }, null, ' '));
    fs.writeFileSync(path.join(OutputPath, 'public', 'assets', 'client_config.json.zip'), zlib.gzipSync(JSON.stringify({
        hierarchy: stripClientHierarchy(configHierarchy, configFiles),
        definitions: stripClientConfig(strippedConfig),
        levelToXpMap: levelToXpMap,
        skillToFieldMap: skillToFieldMap,
        characterColorOptions: characterColorOptions,
        characterTypeOptions: characterTypeOptions,
        materialToLevelMap: materialToLevelMap,
        names: names,
        badWords: badWords,
        adjectives: adjectives,
        prayerList: prayerList,
        segmentToPVPMultiplier: segmentToPVPMultiplier,
        segmentToSongs: segmentToSongs,
        segmentToBackgroundColor: segmentToBackgroundColor,
        forceSongChanges: forceSongChanges,
        questList: questList,
        collectionLog: collectionLog
    }, null, ' ')));
}

export default ExportConfig;