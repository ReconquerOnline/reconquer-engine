import { Panel } from './UI.js';
import { ChatRenderer, MainScene } from './Editor.js'
import { CustomOrbitControls } from './CustomOrbitControls.js';

import * as Utils from './Utils.js'
import { getAssetById, ChatMaterials, Config, getCharacterId } from './Loader.js';
import { AmbientLight, Box3, DirectionalLight, OrthographicCamera, Scene, Vector3 } from 'three';
import * as StateHandler from './StateHandler.js';

var ChatViewport = new Panel()
    .setWidth('150px')
    .setHeight('150px')
    .setPosition('absolute')
    .setRight('0px')
    .setTop('0px');

var Camera = new OrthographicCamera(0, 0, 0, 0, 0.1, 10);

ChatViewport.dom.appendChild(ChatRenderer.domElement);
const controls = new CustomOrbitControls(Camera, ChatRenderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.maxPolarAngle = 3 * Math.PI / 8;
controls.minPolarAngle = 3 * Math.PI / 8;

var scene = new Scene();

ChatViewport.setItem = function (target) {

    Utils.clearObject(scene);

    var id, state;
    if (typeof target == 'string') {
        var object = Utils.getObjectByUUID(MainScene, target);
        id = object.userData.type;
        state = JSON.parse(JSON.stringify(object.userData.state));
        state.sa = 0;
    } else {
        id = target[0];
        state = { q: target[1] };
    }

    var definition = Config.definitions[id];

    var ambientLight = new AmbientLight(0xbbbbbb, Math.PI);
    scene.add(ambientLight);
    var directionalLight = new DirectionalLight(0xffffff, Math.PI/2);
    directionalLight.position.z = 1;
    directionalLight.position.x = .2;
    scene.add(directionalLight);

    var clone = getAssetById(id);
    clone.userData.state = {};
    clone.userData.type = id;
    if (definition.itemId) {
        clone.traverse((obj) => {
            if (obj.geometry) {
                obj.geometry = obj.geometry.clone();
                if (definition.rotateThumbnail) obj.geometry.rotateX(Math.PI / 2);
                obj.geometry.rotateY(Math.PI / 8);
            }
        });
    }
    if (definition.state) {
        var configState = definition.state;
        StateHandler.applyConfig(clone, configState, state);
    }
    clone.traverse((obj) => {
        if (obj.material) {
            obj.material = ChatMaterials[obj.material.name];
        }
    });

    var box = new Box3().expandByObject(clone);
    var sizeX = Math.abs(box.min.x - box.max.x) / 2;
    var sizeY = Math.abs(box.min.y - box.max.y) / 2;
    var size = sizeX > sizeY ? sizeX : sizeY;
    var midHeight = (box.min.y + box.max.y) / 2;
    var midWidth = (box.min.x + box.max.x) / 2;

    Camera.left = -size * 1.2;
    Camera.right = size * 1.2;
    Camera.top = size * 1.2;
    Camera.bottom = -size * 1.2;
    controls.target.set(midWidth, midHeight, 0);
    Camera.position.set(midWidth, midHeight, 5);

    if (definition.cameraHeight) {

        Camera.position.x = 0;
        controls.target.x = 0;

        controls.enableRotate = false;
        Camera.position.y = definition.cameraHeight;
        controls.target.y = definition.cameraHeight;
        var angle = definition.cameraAngle ? definition.cameraAngle : target == getCharacterId() ? -Math.PI / 5 : Math.PI / 5;
        Camera.position.applyAxisAngle(new Vector3(0, 1, 0), angle);
        Camera.left = -.2;
        Camera.right = .2;
        Camera.top = .2;
        Camera.bottom = -.2;
    } else {
        controls.enableRotate = true;
    }
    Camera.updateProjectionMatrix();
    controls.update();

    // remove fade in
    var mixer = clone.userData.mixer;
    if (mixer) {
        mixer.update(0);
        mixer.update(150);
    }

    scene.add(clone);
}

var lastTime;
function render() {
    var time = Date.now();

    var delta = lastTime != undefined ? time - lastTime : 0;
    lastTime = time;

    // update all mixers
    scene.traverse(function (object) {
        var mixer = object.userData.mixer;
        if (mixer) {
            mixer.update(delta / 1000);
        }
    });

    controls.update();
    ChatRenderer.render(scene, Camera);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);

export default ChatViewport;