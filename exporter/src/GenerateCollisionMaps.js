import { extractFloor, lookupItemInMap } from './Utils.js';
import { Matrix4, Vector3, Vector2 } from 'three'

function addCollision(collisionMap, worldX, worldY, floor, xAxis) {
    // calculate which segment/point this change should be in based on startPoint
    var segX = 500 + Math.floor((worldX + 32) / 64);
    var segY = 500 + Math.floor((worldY + 32) / 64);
    var x = (((worldX + 32) % 64) + 64) % 64;
    var y = (((worldY + 32) % 64) + 64) % 64;

    var absoluteX = segX * 64 + x;
    var absoluteY = segY * 64 + y;

    if (!collisionMap[absoluteX]) {
        collisionMap[absoluteX] = {}
    }
    if (!collisionMap[absoluteX][absoluteY]) {
        collisionMap[absoluteX][absoluteY] = {}
    }
    if (!collisionMap[absoluteX][absoluteY][floor]) {
        collisionMap[absoluteX][absoluteY][floor] = [0,0]
    }

    // add edge to appropriate segment array
    if (xAxis) {
        collisionMap[absoluteX][absoluteY][floor][0] += 1;
    } else {
        collisionMap[absoluteX][absoluteY][floor][1] += 1;
    }
}

function addStaticCollision(collisionMesh, collisionMap, floor) {
    var indicies = collisionMesh.getMesh().listPrimitives()[0].getIndices();
    var vertices = collisionMesh.getMesh().listPrimitives()[0].getAttribute('POSITION');
    for (var i = 0; i < indicies.getCount(); i += 3) {
        var vertA = vertices.getElement(indicies.getElement(i, [])[0], []);
        var vertB = vertices.getElement(indicies.getElement(i + 1, [])[0], []);
        var vertC = vertices.getElement(indicies.getElement(i + 2, [])[0], []);
        var worldMatrix = new Matrix4().fromArray(collisionMesh.getWorldMatrix());
        // transform to world space
        vertA = new Vector3().fromArray(vertA).applyMatrix4(worldMatrix);
        vertB = new Vector3().fromArray(vertB).applyMatrix4(worldMatrix);
        vertC = new Vector3().fromArray(vertC).applyMatrix4(worldMatrix);

        // convert to rounded vector2
        var pointA = new Vector2(vertA.x, vertA.z * -1).round();
        var pointB = new Vector2(vertB.x, vertB.z * -1).round();
        var pointC = new Vector2(vertC.x, vertC.z * -1).round();

        // determine which points actually changed
        var startPoint = pointA;
        var endPoint = pointA.equals(pointB) ? pointC : pointB;

        // normalize so that startPoint is lower than endpoint
        if (startPoint.x > endPoint.x) {
            var swap = startPoint.x;
            startPoint.x = endPoint.x;
            endPoint.x = swap;
        } else if (startPoint.y > endPoint.y) {
            var swap = startPoint.y;
            startPoint.y = endPoint.y;
            endPoint.y = swap;
        }

        addCollision(collisionMap, startPoint.x, startPoint.y, floor, startPoint.x != endPoint.x);
    }
}

function addStaticCollisionBox(node, collisionMap, box, floor) {
    var worldPosition = node.getWorldTranslation();
    var x = Math.round(worldPosition[0] - 0.5);
    var y = Math.round(-worldPosition[2] - 0.5);

    // handle rotation
    var rotation = node.getRotation();
    var angle = 2 * Math.acos(rotation[3]) * 180 / Math.PI;
    angle = Math.round(angle / 45) * 45;
    if (rotation[1] > 0 && angle != 0 && angle != 180) angle += 180;
    angle = angle % 360;
    var direction = angle / 90;

    var width = box[0];
    var height = box[1];
    var startX = x;
    var startY = y;

    if (direction == 1) {
        width = box[1];
        height = box[0];
        startY = y - height + 1;
    } else if (direction == 2) {
        startX = x - width + 1;
        startY = y - height + 1;
    } else if (direction == 3) {
        width = box[1];
        height = box[0];
        startX = x - width + 1;
    }
    for (var a = 0; a < width; a++) {
        for (var b = 0; b < height; b++) {
            addCollision(collisionMap, startX + a, startY + b, floor, true);
            addCollision(collisionMap, startX + a, startY + b, floor, false);
            addCollision(collisionMap, startX + a + 1, startY + b, floor, false);
            addCollision(collisionMap, startX + a, startY + b + 1, floor, true);
        }
    }
}

function extractLeadingNumber(str) {
    const match = str.match(/^\d+/); 
    return match ? parseInt(match[0]) : null; 
}

function GenerateCollisionMaps(environment, configFiles) {
    var collisionMap = {};
    var attackCollisionMap = {};

    environment.getRoot().getDefaultScene().traverse(function (node) {
        var id = node.getName();

        if (id.startsWith('Seg-')) {
            var segX = extractLeadingNumber(id.split('-')[1]);
            var segY = extractLeadingNumber(id.split('-')[2]);
            if (segX == null || segY == null) {
                throw 'Could not parse segments'
            }
        }

        var configEntry = lookupItemInMap(id, configFiles);
        var floor = extractFloor(node.getName(), node.getParent().getName());
        if (configEntry && configEntry.staticCollisionBox) {
            addStaticCollisionBox(node, collisionMap, configEntry.staticCollisionBox, floor);
            if (configEntry.attackCollision) {
                addStaticCollisionBox(node, attackCollisionMap, configEntry.staticCollisionBox, floor);
            }
        }
        if (id.includes('_collision')) {
            addStaticCollision(node, collisionMap, floor);
        }
        if (id.includes('_attackcollision')) {
            addStaticCollision(node, collisionMap, floor);
            addStaticCollision(node, attackCollisionMap, floor);
        }
    });

    // Make attack collision map share same x,y,floor map
    for (var x in collisionMap) {
        if (!attackCollisionMap[x]) attackCollisionMap[x] = {};
        for (var y in collisionMap[x]) {
            if (!attackCollisionMap[x][y]) attackCollisionMap[x][y] = {};
            for (var f in collisionMap[x][y]) {
                if (!attackCollisionMap[x][y][f]) attackCollisionMap[x][y][f] = [0, 0];
            }
        }
    }


    return {
        collisionMap: collisionMap,
        attackCollisionMap: attackCollisionMap
    };
}

export default GenerateCollisionMaps;