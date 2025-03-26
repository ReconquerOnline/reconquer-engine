import { transportToPoint, dropRandomItem, removeSpecialItems } from '../action_utils.js';
import { sendCharacterMessage } from '../message.js';
import { definitions, segmentToSpawnPoints, skillToFieldMap, spawnPoints } from '../loader.js';

var skills = [
    "accuracy",
    "defense",
    "strength",
    "archery",
    "fishing",
    "forestry",
    "cooking",
    "mining",
    "smithing",
    "crafting",
    "farming"
]

export default class PlayerBehavior {
    constructor(item) {
        this.item = item;
        this.tick = 0;

    }
    update(worldState) {
        var pub = worldState.pub[this.item.pub.i];
        var priv = worldState.priv[this.item.pub.i];

        this.tick += 1;
        if (this.tick % 100 == 0) {
            if (pub.hp < pub.mhp) {
                pub.hp += 1;
            }
            for (var skill of skills) {
                if (priv[skillToFieldMap[skill][2]] > priv[skillToFieldMap[skill][1]]) {
                    priv[skillToFieldMap[skill][2]] -= 1;
                }
            }

        }
    }
    handleDeath(worldState) {
        var pub = worldState.pub[this.item.pub.i];
        var droppedItem = dropRandomItem(worldState.priv[pub.i], pub, worldState);
        var msg = 'Oh no! I was defeated.';
        if (droppedItem) {
            msg += ' I lost my ' + definitions[droppedItem].itemName.toLowerCase() + '.';
        }
        sendCharacterMessage(msg, pub.i, worldState);

        removeSpecialItems(worldState.priv[pub.i], pub.i, worldState);

        var spawnPoint = segmentToSpawnPoints[pub.lsx + '-' + pub.lsy];
        if (spawnPoint === undefined) {
            spawnPoint = 0;
        }
        var listOfPoints = spawnPoints[spawnPoint];
        var point = listOfPoints[Math.floor(listOfPoints.length * Math.random())];

        transportToPoint(pub, {
            lsx: point[0],
            lsy: point[1],
            lx: point[2],
            ly: point[3],
            lf: 0,
            li: 0,
            lr: 0
        }, worldState);
        pub.hp = pub.mhp;
        worldState.serv[pub.i].ds += 1;
        worldState.priv[pub.i].fid = 0;
        for (var skill of skills) {
            worldState.priv[pub.i][skillToFieldMap[skill][2]] = worldState.priv[pub.i][skillToFieldMap[skill][1]];
        }
        worldState.serv[pub.i].tp = 100 * worldState.priv[pub.i][skillToFieldMap['fidelity'][1]];
    }
}
