import { Camera, MainScene, Renderer, DirectedLight, updatePixelRatio } from './Editor.js'
import { Panel, Button } from './UI.js';
import { SVG } from './Loader.js';
import * as Utils from './Utils.js';
import * as Signals from './Signals.js';
import * as Loader from './Loader.js';
import * as Communication from './Communication.js';
import * as ClickSprite from './ClickSprite.js';
import * as InteractionsPopup from './InteractionsPopup.js';
import { Color, Fog, Quaternion, Vector2, Vector3, Raycaster, PerspectiveCamera, ArrowHelper } from 'three';
import { CustomOrbitControls } from './CustomOrbitControls.js';
import { UseArray, clearUseArray } from './Inventory.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import Chat from './Chat.js';
import CharacterEditor from './CharacterEditor.js';
import Tutorial from './Tutorial.js';
import { TalkList } from './MessageHandler.js';

const Viewport = new Panel();
export default Viewport;
Viewport.setClass('Viewport');

Viewport.dom.appendChild(Renderer.domElement);
const controls = new CustomOrbitControls(Camera, Renderer.domElement);
controls.maxPolarAngle = Math.PI / 2 * 1.02;
controls.maxDistance = 32;
controls.disableLeftClickRotate = false;
controls.zoomSpeed = 1.5;
controls.rotateSpeed = 0.75;

export function disableLeftClickRotate(value) {
    controls.disableLeftClickRotate = value;
}

var skyMesh, arrowMesh;

function onResize() {
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    var width = Viewport.dom.offsetWidth;

    Camera.aspect = width / height;
    Camera.updateProjectionMatrix();
    Renderer.setSize(width, height);
    composer.setSize( width, height );
}

function handleInterpolation(object, interpolation, time) {
    if (!interpolation.startTime) {
        interpolation.startTime = time;
        interpolation.endTime = time + interpolation.len;
    }
    object.position.lerpVectors(
        interpolation.startPosition,
        interpolation.endPosition,
        Math.min(1, (time - interpolation.startTime) / interpolation.len)
    );
    object.quaternion.slerpQuaternions(
        interpolation.startRotation,
        interpolation.endRotation,
        Math.min(1, (time - interpolation.startTime) / (interpolation.rotationLen ? interpolation.rotationLen : interpolation.len))
    );

    if (time > interpolation.endTime) {
        if (interpolation.callback) interpolation.callback();
        object.userData.interpolation = null;
    }
}


var renderScene = new RenderPass( MainScene, Camera );

var bloomPass = new UnrealBloomPass( new Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = 1.5;
bloomPass.strength = .35;
bloomPass.radius = .2;

var outputPass = new OutputPass();

var composer = new EffectComposer( Renderer );
composer.addPass( renderScene );
composer.addPass( bloomPass );
composer.addPass( outputPass );

var canceled = true;
var lastTime;
var lastCharacterPosition = null;
var renderState = 6;

export function updateRenderState(newState) {
    renderState = newState;

    if (renderState == 1) {
        Renderer.shadowMap.enabled = false;
        DirectedLight.castShadow = false;
        updatePixelRatio(window.devicePixelRatio/2);
    } else if (renderState == 2) {
        Renderer.shadowMap.enabled = true;
        DirectedLight.castShadow = true;
        updatePixelRatio(window.devicePixelRatio/2);
    } else if (renderState == 3) {
        Renderer.shadowMap.enabled = true;
        DirectedLight.castShadow = true;
        updatePixelRatio(window.devicePixelRatio/2);
    } else if (renderState == 4) {
        Renderer.shadowMap.enabled = false;
        DirectedLight.castShadow = false;
        updatePixelRatio(window.devicePixelRatio);
    } else if (renderState == 5) {
        Renderer.shadowMap.enabled = true;
        DirectedLight.castShadow = true;
        updatePixelRatio(window.devicePixelRatio);
    } else {
        Renderer.shadowMap.enabled = true;
        DirectedLight.castShadow = true;
        updatePixelRatio(window.devicePixelRatio);
    }
}

var leftRotate = 0;
var upRotate = 0;
var dollySpeed = 1;

var arrowMeshY = 0;
function render() {
    if (!canceled) {
        var time = Date.now();

        var delta = lastTime != undefined ? time - lastTime : 0;
        lastTime = time;

        if (arrowMesh.visible) {
            arrowMesh.position.y = arrowMeshY + Math.sin(time/ 150) / 5;
        }

        ClickSprite.update(delta);

        // update all interpolations
        MainScene.traverse(function (object) {
            var interpolation = object.userData.interpolation;
            if (interpolation) {
                handleInterpolation(object, interpolation, time / 1000);
            }
        });

        // update all mixers
        MainScene.traverse(function (object) {
            var mixer = object.userData.mixer;
            if (mixer) {
                mixer.update(delta / 1000);
            }
        });

        var character = Loader.getCharacter();
        if (lastCharacterPosition != null) {
            Camera.position.add(character.position).sub(lastCharacterPosition);
            DirectedLight.position.copy(character.position).add(new Vector3(5, 50, 25));
            DirectedLight.target = character;
        } else {
            lastCharacterPosition = new Vector3()
        }
        if (Loader.Textures["water_texture.svg"] && Loader.Textures["lava_texture.svg"]) {
            Loader.Textures["water_texture.svg"].offset.x += .001 * Math.sin(time * .001 / 4) + .0002 * Math.sin(1 + time * .004 / 4);
            Loader.Textures["water_texture.svg"].offset.y += .001 * Math.cos(time * .00075 / 4);
            Loader.Textures["lava_texture.svg"].offset.x += .0005 * Math.sin(time * .001 / 4) + .0001 * Math.sin(1 + time * .004 / 4);
            Loader.Textures["lava_texture.svg"].offset.y += .0005 * Math.cos(time * .00075 / 4);
        }
        lastCharacterPosition.copy(character.position);
        skyMesh.position.copy(character.position);
        skyMesh.position.setY(0);

        controls.rotateUp(upRotate);
        controls.rotateLeft(leftRotate);
        controls.dollyIn(dollySpeed);

        controls.target.set(character.position.x, character.position.y + 1.5, character.position.z);
        controls.update();

        if (renderState == 3 || renderState == 6) {
            composer.render();
        } else {
            Renderer.render(MainScene, Camera)
        }
    }
    requestAnimationFrame(render);
}
render();


Signals.subscribe("beginLocationChange", function () {
    canceled = true;
})
Signals.subscribe("newTick", function(){
    canceled = false;
})
function beginRendering() {
    canceled = false;
    lastCharacterPosition = null;
    onResize();
}

function addBlockAction(object, interactions) {
    if (object.userData.type == "character" && object.userData.state.si == 0) {
        // make sure chat is enabled
        var char = Loader.getCharacter();
        if (!char) return;
        if (char.userData.state.chat == 0) return;

        // make sure character has talked during this session
        if (TalkList.indexOf(object.userData.uuid) == -1) return;

        var blockList = localStorage.getItem(char.userData.uuid + '_blockList') ? JSON.parse(localStorage.getItem(char.userData.uuid + '_blockList')) : [];
        // make sure not already on block list
        if (blockList.indexOf(object.userData.uuid) == -1) {
            interactions.push({
                type: "block",
                interaction: 'Block'
            })
        }
    }
}

function addPushAction(object, interactions) {
    if ((object.userData.type == "character" && object.userData.state.si == 0) ||
        object.userData.type == "dog" || object.userData.type == "packmule") {
        var character = Loader.getCharacter();

        if (character.userData.state.lf == object.userData.state.lf &&
            Math.abs(character.userData.state.lx - object.userData.state.lx) <= 1 &&
            Math.abs(character.userData.state.ly - object.userData.state.ly) <= 1
        ) {
            interactions.push({
                type: "push",
                interaction: "Push through"
            })
        }
    }
}

function getInteractions(definition, object, slot) {
    if (!definition) return [];

    if (UseArray.length > 0 && Utils.getDisplayName(object.userData).displayName) {
        return [{ type: 'on', interaction: 'On' }];
    }

    if (object.userData.uuid == Loader.getCharacterId() && object.userData.state[slot]) {
        var customObject = {
            userData: {
                type: object.userData.state[slot], uuid: slot
            }
        };
        return [{ type: 'remove', interaction: 'Remove', object: customObject }];
    } else if (object.userData.uuid == Loader.getCharacterId()) {
        return [];
    }

    if (definition.state) {
        var chooseInteraction = definition.state.filter(x => x.behavior == 'chooseInteraction')[0];
        if (chooseInteraction) {
            var value = object.userData.state[chooseInteraction.id];
            var interactions = structuredClone(chooseInteraction.options[value]);
            // add push interaction if within one square
            addPushAction(object, interactions)
            addBlockAction(object, interactions);
            return interactions;
        }
    }
    if (definition.interactions) {
        var interactions = structuredClone(definition.interactions);
        addPushAction(object, interactions);
        return interactions;
    }
    return [];
}

var mouseX = 0;
var mouseY = 0;
Viewport.onMouseMove(function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
})

var downPosition = {};
Viewport.onMouseDown(function (event) {
    downPosition.x = event.clientX;
    downPosition.y = event.clientY;
});

function preventMovement() {
    var currentPrompt = Tutorial.getCurrentPrompt();
    return (currentPrompt >= 0 && currentPrompt < 3) || CharacterEditor.isVisible();
}

function handleMouseUp(event) {
    if (preventMovement()) return;

    var xChange = Math.abs(downPosition.x - event.clientX);
    var yChange = Math.abs(downPosition.y - event.clientY);
    if (xChange * xChange + yChange * yChange > 9 & !event.force) return;
    Signals.publish('viewportClick');

    var characterFloor = Loader.getCharacter().userData.state.lf;
    var objects = MainScene.children
        .filter(x => x.visible == true || x.userData.includeCollision)
        .filter(x => !x.type.includes('Light'))
        .filter(x => !x.userData.state || x.userData.state.lf == characterFloor)
        .filter(x => x.name != 'sky')
        .filter(x => x.name != 'arrow_helper')
        .filter(x => !x.isSprite)
    objects.forEach(x => {
        x.traverse(y => {
            if (y.isSkinnedMesh) {
                y.computeBoundingBox();
                y.computeBoundingSphere();
            }
        })
    })
    var collisionIntersects = Utils.raycastCamera(Camera, objects, Viewport.getBounds(), event.clientX, event.clientY)
        .filter(x => !x.object.isSprite)
        .filter(x => !x.object.type.includes('Light'))
        .filter(x => x.object.visible == true || x.object.userData.includeCollision)
        .filter((x) => {
            var object = x.object;
            while (object.parent) {
                if (object.visible == false && !object.userData.includeCollision) return false;
                object = object.parent;
            }
            return true;
        });
    if (typeof DEBUG !== 'undefined') {
        console.log(MainScene.children, objects, Utils.raycastCamera(Camera, objects, Viewport.getBounds(), event.clientX, event.clientY));
    }

    if (collisionIntersects.length > 0) {
        var collision = collisionIntersects[0];
        var object = collision.object;
        var equipmentSlot = Loader.EquipmentNameToSlots[object.name];
        while (!object.name.startsWith('Seg-') && !object.userData.uuid) {
            equipmentSlot = equipmentSlot ? equipmentSlot : Loader.EquipmentNameToSlots[object.name];
            object = object.parent;
        }
        // if object is segment or object affects height, move
        var definition = Loader.Config.definitions[object.userData.type];
        var interactions = getInteractions(definition, object, equipmentSlot);
        if (interactions.length > 0) {
            if (event.button == 0) {
                ClickSprite.showRed(collision.point);
                var uuid = interactions[0].object ? interactions[0].object.userData.uuid : object.userData.uuid
                Communication.interact(uuid, interactions[0], UseArray);
                clearUseArray();
            } else if (event.button == 2) {
                var userData = interactions[0].object ? interactions[0].object.userData : object.userData;
                InteractionsPopup.create(event, userData, interactions);
            }
        } else if (object.name.startsWith('Seg-') || (definition && definition.affectsHeight)) {
            var point = collision.point;
            var gridCoordinates = Utils.absolutePointToGridPoint(point.x, point.z);
            if (event.button == 0) {
                ClickSprite.showYellow(point);
                clearUseArray();
                Communication.move(gridCoordinates.segX, gridCoordinates.segY, gridCoordinates.x, gridCoordinates.y);
            } else {
                InteractionsPopup.create(event, { state: {dn:'Here'} }, [{
                    segX: gridCoordinates.segX,
                    segY: gridCoordinates.segY,
                    x: gridCoordinates.x,
                    y: gridCoordinates.y,
                    type: 'move',
                    interaction: 'Move'
                }]);
            }
        }
    }
}
Viewport.onMouseUp(handleMouseUp);
Utils.touchRightClick(Viewport, (event) => {
    downPosition.x = event.clientX;
    downPosition.y = event.clientY;
    handleMouseUp(event)
})

Signals.subscribe('windowResize', onResize);
Signals.subscribe('beginRendering', beginRendering);
Signals.subscribe('disconnect', function (message) {
    canceled = true;
});

Signals.subscribe('segmentChange', function (obj) {
    var segX = obj.x;
    var segY = obj.y;
    if (Loader.Config.segmentToBackgroundColor[segX + '-' + segY]) {
        MainScene.background = new Color(Loader.Config.segmentToBackgroundColor[segX + '-' + segY]);
        MainScene.fog = new Fog(Loader.Config.segmentToBackgroundColor[segX + '-' + segY], 48, 96);
        skyMesh.visible = false;
    } else {
        MainScene.background = new Color(0x3498db);
        MainScene.fog = new Fog(0x3498db, 48, 96);
        skyMesh.visible = true;
    }
});

Signals.subscribe('assetsLoaded', function () {
    skyMesh = Loader.getAssetById('sky');
    skyMesh.renderOrder = -1;
    skyMesh.material.depthWrite = false;
    skyMesh.material.depthTest = false;
    MainScene.add(skyMesh);

    // add helper arrow
    var dir = new Vector3(0, -1, 0);
    dir.normalize();
    var origin = new Vector3(0, 20, 0);
    var length = 0.5;
    var hex = 0xf1c40f;
    arrowMesh = new ArrowHelper(dir, origin, length, hex, .5, .5);
    arrowMesh.visible = false;
    arrowMesh.name = 'arrow_helper';
    MainScene.add(arrowMesh);
})

export function displayArrowMesh(x, y, z) {
    arrowMesh.position.set(x, y, z);
    arrowMesh.visible = true;
    arrowMeshY = y;
}
export function hideArrowMesh() {
    if (arrowMesh) {
        arrowMesh.visible = false;
        arrowMesh.position.set(0, -100, 0);
    }
}


var xDirection = 0;
var yDirection = 0;
function sendMovement() {
    if (xDirection !== 0 || yDirection !== 0) {
        var character = Loader.getCharacter();
        if (character) {
            // transform xDirection/yDirection based on camera...
            var cameraVector = new Vector3().subVectors(Camera.position, controls.target).setY(0).normalize()
            var quaternion = new Quaternion().setFromUnitVectors(cameraVector, new Vector3(0, 0, 1));
            var movementVector = new Vector3(xDirection, 0, yDirection).normalize();
            movementVector.applyQuaternion(quaternion);
            movementVector.normalize().multiplyScalar(Math.SQRT2)

            var transformedY = Math.round(movementVector.z);
            var transformedX = Math.round(movementVector.x);

            var absX = character.userData.state.lsx * 64 + character.userData.state.lx + transformedX;
            var absY = character.userData.state.lsy * 64 + character.userData.state.ly + transformedY;
            Signals.publish('viewportClick');
            Communication.move(
                Math.floor(absX / 64),
                Math.floor(absY / 64),
                absX % 64,
                absY % 64
            )
        }
    }
}
export function getVerticalCollisions(raycasterPosition) {
    var character = Loader.getCharacter();

    var raycaster = new Raycaster(raycasterPosition, new Vector3(0, -1, 0));
    raycaster.camera = new PerspectiveCamera(0,0,0,0);
    var objects = MainScene.children
        .filter(x => x.visible == true || x.userData.includeCollision)
        .filter(x => !x.type.includes('Light'))
        .filter(x => !x.userData.state || x.userData.state.lf == character.userData.state.lf)
        .filter(x => x.name != 'sky')
        .filter(x => x.name != 'arrow_helper')
        .filter(x => !x.isSprite);
    return raycaster.intersectObjects(objects, true)
        .filter((x) => {
            var object = x.object;
            while (object.parent) {
                if (object.visible == false && !object.userData.includeCollision) return false;
                object = object.parent;
            }
            return true;
        });
}

Signals.subscribe('newTick', sendMovement);
function raycastVertical(raycasterPosition) {
    var collisionIntersects = getVerticalCollisions(raycasterPosition)
    if (collisionIntersects.length > 0) {
        var collision = collisionIntersects[0];
        var object = collision.object;
        while (!object.name.startsWith('Seg-') && !object.userData.uuid) {
            object = object.parent;
        }
        var definition = Loader.Config.definitions[object.userData.type];
        var interactions = getInteractions(definition, object);
        if (interactions.length > 0) {
            var uuid = interactions[0].object ? interactions[0].object.userData.uuid : object.userData.uuid
            Communication.interact(uuid, interactions[0], UseArray);
            clearUseArray();
            return true;
        }
    }
}
function interactInFront() {
    function interactWithRotation(position, rotation, scale) {
        rotation = (rotation + 12) % 4;
        var x = 0;
        var y = 0;
        if (rotation == 0) {
            y = 1;
        } else if (rotation == 0.5) {
            y = 1;
            x = -1;
        } else if (rotation == 1) {
            x = -1;
        } else if (rotation == 1.5) {
            y = -1;
            x = -1;
        } else if (rotation == 2) {
            y = -1;
        } else if (rotation == 2.5) {
            y = -1;
            x = 1;
        } else if (rotation == 3) {
            x = 1;
        } else if (rotation == 3.5) {
            y = 1;
            x = 1;
        }
        var raycasterPosition = position.clone();
        raycasterPosition.x += x * scale;
        raycasterPosition.z += y * scale;
        raycasterPosition.y = 100;
        return raycastVertical(raycasterPosition);
    }

    var character = Loader.getCharacter();
    if (character) {
        var rotation = character.userData.state.lr;
        var rotationChanges = [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2];
        for (var change of rotationChanges) {
            if (interactWithRotation(character.position, rotation + change, 1)
                || interactWithRotation(character.position, rotation + change, 1.5)
                || interactWithRotation(character.position, rotation + change, 0.5)) {
                break;
            }
        }
    }
}

var spaceDown = false;
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
            yDirection = 0;
            break;
        case 'ArrowDown':
            yDirection = 0;
            break;
        case 'ArrowLeft':
            xDirection = 0;
            break;
        case 'ArrowRight':
            xDirection = 0;
            break;
        case 'KeyW':
            upRotate = 0;
            break;
        case 'KeyA':
            leftRotate = 0;
            break;
        case 'KeyS':
            upRotate = 0;
            break;
        case 'KeyD':
            leftRotate = 0;
            break;
        case 'KeyE':
            dollySpeed = 1
            break;
        case 'KeyQ':
            dollySpeed = 1
            break;
        case 'Space':
            spaceDown = false;
            break;
    }
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
            if (!preventMovement()&& yDirection !== 1) {
                yDirection = 1;
                sendMovement();
            }
            break;
        case 'ArrowDown':
            if (!preventMovement() && yDirection !== -1) {
                yDirection = -1;
                sendMovement();
            }
            break;
        case 'ArrowLeft':
            if (!preventMovement() && xDirection !== -1) {
                xDirection = -1;
                sendMovement();
            }
            break;
        case 'ArrowRight':
            if (!preventMovement() && xDirection !== 1) {
                xDirection = 1;
                sendMovement();
            }
            break;
        case 'KeyW':
            upRotate = 2 * Math.PI/150
            break;
        case 'KeyA':
            leftRotate = -2 * Math.PI/150
            break;
        case 'KeyS':
            upRotate = -2 * Math.PI/150
            break;
        case 'KeyD':
            leftRotate = 2 * Math.PI/150
            break;
        case 'KeyE':
            dollySpeed = 0.95
            break;
        case 'KeyQ':
            dollySpeed = 1/0.95
            break;
        case 'Space':
            if (!preventMovement() && !spaceDown) {
                spaceDown = true;
                if (Chat.isChatActive()) {
                    if (Chat.isSelect()) break;
                    Chat.displayMessage();
                } else {
                    interactInFront();
                }   
            }         
            break;
        case 'Numpad1':
        case 'Digit1':
            Chat.selectOption(0)
            break;
        case 'Numpad2':
        case 'Digit2':
            Chat.selectOption(1)
            break;
        case 'Numpad3':
        case 'Digit3':
            Chat.selectOption(2)
            break;
        case 'Numpad4':
        case 'Digit4':
            Chat.selectOption(3)
            break;
    }
}
window.addEventListener('keydown', onKeyDown);
window.addEventListener( 'keyup', onKeyUp );