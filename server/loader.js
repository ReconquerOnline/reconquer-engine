import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateInfoString, getMatchMap } from './utils.js';

const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

var config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
export var hierarchy = config.hierarchy;
export var definitions = config.definitions;
export var collisionMap = config.collisionMap;
export var attackCollisionMap = config.attackCollisionMap;
export var levelToXpMap = config.levelToXpMap;
export var skillToFieldMap = config.skillToFieldMap;
export var materialToSuccessChanceMap = config.materialToSuccessChanceMap;
export var materialToLevelMap = config.materialToLevelMap;
export var materialToXPMap = config.materialToXPMap;
export var characterOptions = config.characterTypeOptions.concat(config.characterColorOptions);
export var names = config.names;
export var adjectives = config.adjectives;
export var prayerList = config.prayerList; 
export var segmentToPVPMultiplier = config.segmentToPVPMultiplier;
export var spawnPoints = config.spawnPoints;
export var segmentToSpawnPoints = config.segmentToSpawnPoints;


var stateAnimationNameMap = {};
var stateAnimationIndexMap = {};
export var generatedInfoStrings = {};
for (var key in definitions) {
    var definition = definitions[key]
    generatedInfoStrings[key] = generateInfoString(definition);

    if (!definition || !definition.state) continue;
    var stateAnimation = definition.state.find(x => x.id == 'sa');
    if (stateAnimation) {
        stateAnimationNameMap[key] = {};
        stateAnimationIndexMap[key] = {}
        for (var i = 0; i < stateAnimation.options.length; i++) {
            var option = stateAnimation.options[i];
            var shortName = option.name.split('_').slice(1).join('_');
            stateAnimationNameMap[key][shortName] = { index: i, ticks: option.duration / 0.6 };
            stateAnimationIndexMap[key][i] = { name: shortName };
        }
    }
}

export function getAnimationTicks(target, animation) {
    if (stateAnimationNameMap[target.t] === undefined ||
        stateAnimationNameMap[target.t][animation] === undefined) return 0;
    return stateAnimationNameMap[target.t][animation].ticks;
}

export function setAnimation(target, animation) {
    if (stateAnimationNameMap[target.t] === undefined ||
        stateAnimationNameMap[target.t][animation] === undefined) return false;
    target.sa = stateAnimationNameMap[target.t][animation].index;
    return stateAnimationNameMap[target.t][animation].ticks;
}

export function getAnimationName(target, index) {
    if (!target.t || !stateAnimationIndexMap[target.t] || !stateAnimationIndexMap[target.t][index]) return '';
    return stateAnimationIndexMap[target.t][index].name;
}

export var examineMap = getMatchMap(definitions, 'examineMatch');
export var pickMap = getMatchMap(definitions, 'pickMatch');
export var chopMap = getMatchMap(definitions, 'chopMatch');
export var mineMap = getMatchMap(definitions, 'mineMatch');