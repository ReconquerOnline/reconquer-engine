import * as Signals from './Signals.js';
import * as Loader from './Loader.js';
import * as StateHandler from './StateHandler.js';
import * as LocationHandler from './LocationHandler.js';
import * as DisplayName from './DisplayName.js';
import * as Utils from './Utils.js';
import * as MessageHandler from './MessageHandler.js';
import * as HitpointsHandler from './HitpointsHandler.js';
import * as LocalInstance from './LocalInstance.js';
import * as AmmoAnimation from './AmmoAnimation.js';
import { Camera, MainScene } from './Editor.js';
import { getObjectByUUID } from './Utils.js';
import { PlaneGeometry, Object3D, Mesh, MeshBasicMaterial, Box3 } from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

import Viewport from './Viewport.js';
import Inventory from './Inventory.js';
import Toolbar from './Toolbar.js';
import Chat from './Chat.js';
import Info from './Info.js';
import Shop from './Shop.js';
import Bank from './Bank.js';
import Trade from './Trade.js';
import SmithingInterface from './SmithingInterface.js';
import InteractionsPopup from './InteractionsPopup.js';
import LoadingBar, { webglNotSupported } from './LoadingBar.js';
import LoginScreen from './LoginScreen.js';
import CharacterEditor from './CharacterEditor.js';
import Tutorial from './Tutorial.js';
import FlashingArrow from './FlashingArrow.js';
import QuestsPanel from './QuestsPanel.js';
import SettingsPanel from './SettingsPanel.js';
import CollectionLogPanel from './CollectionLogPanel.js';
import EquipmentPanel from './EquipmentPanel.js';
import ExperiencePanel from './ExperiencePanel.js';

window.addEventListener("contextmenu", e => e.preventDefault());

var handleResize = function (event) {
    Signals.publish('windowResize', event);
};
window.addEventListener('resize', handleResize);

Signals.subscribe('assetsLoaded', function () {
    //console.log('GLTF', Loader.GLTF);
    //console.log('Config', Loader.Config);
});

function applyConfig(object, actualState) {
    LocationHandler.handleLocationChange(object, actualState);
    HitpointsHandler.handleUpdate(object, actualState);
    Inventory.handleInventoryChange(object, actualState);
    DisplayName.handleDisplayNameChange(object, actualState);
    Shop.handleShopChange(object, actualState);
    Bank.handleBankChange(object, actualState);
    Trade.handleTradeChange(object, actualState);
    SmithingInterface.handleChange(object, actualState);
    Info.handleChange(object, actualState);
    CharacterEditor.handleChange(object, actualState);
    SettingsPanel.handleChange(object, actualState);
    EquipmentPanel.handleChange(object, actualState)

    if (actualState.m !== undefined) {
        MessageHandler.handleMessage(object, actualState.m);
    }
    if (actualState.at) {
        AmmoAnimation.handleUpdate(object, actualState.at);
    }
    if (actualState.pid) {
        object.userData.state.pid = actualState.pid;
    }

    var config = Loader.Config.definitions[actualState.t];
    if (config && config.state) {
        StateHandler.applyConfig(object, config.state, actualState);
    }


    if (actualState.mp) {
        Toolbar.setMessage(actualState.mp);
    }

    Inventory.handleFidelityChange(object, actualState);
    LocalInstance.handleUpdate(object, actualState);
    Tutorial.handleChange(object, actualState);

    if (object.userData.uuid == Loader.getCharacterId()) {
        //console.log(object.userData.state);
    }
}

function addObject(diff) {
    var state = diff.o;

    var scene = diff.scene ? diff.scene: MainScene;

    var existingObject = Utils.getObjectByUUID(scene, state.i)
    if (existingObject) {
        // only apply config if request is not local
        if (!diff.f) {
            applyConfig(existingObject, state);
        }
        return;
    }

    // based on state.t, construct object
    var clone = Loader.getAssetById(state.t);
    // copy
    var copy = new Object3D();
    copy.userData.uuid = state.i;
    copy.userData.type = state.t;
    copy.userData.state = {};
    copy.add(clone);
    applyConfig(copy, state);
    scene.add(copy);

    var oldY = copy.position.y;
    copy.position.y = 0;
    copy.updateWorldMatrix(false, false);
    var box = new Box3().expandByObject(copy);
    copy.userData.height = box.max.y;
    copy.position.y = oldY;
    copy.updateWorldMatrix(false, false);

    var config = Loader.Config.definitions[copy.userData.type];
    copy.traverse((child) => {
        if (child.material && child.material.transparent) return;
        if (config && config.castShadow === false) return;
        child.castShadow = true;
    })
    if (config && config.affectsHeight) {
        Loader.addObjectAffectingHeight(copy);
    }

    if (config && config.itemId) {
        var mesh = new Mesh(new PlaneGeometry(.3, .3), new MeshBasicMaterial({ color: 0xffffff }));
        mesh.rotateX(-Math.PI / 2);
        mesh.position.y = .05
        mesh.userData.includeCollision = true;
        mesh.visible = false;
        copy.add(mesh)
    }
}

function removeObject(diff) {
    var uuid = diff.i;
    // check if object is persistent, if so only remove if request is forced
    if (Loader.PersistentUUIDs[uuid] && !diff.f) return;

    var object = getObjectByUUID(MainScene, uuid);
    if (!object) return;

    Loader.removeObjectAffectingHeight(object);

    object.removeFromParent();
    Utils.clearObject(object);
}

var timeStampDiffs = [];
var lastHandle = Date.now();
var cancel = false;

function applyUpdate(diffs) {
    if (cancel) return;
    //console.log('diff', Date.now() - lastHandle, diffs);
    lastHandle = Date.now();

    if (!diffs) return;
    diffs.sort(Loader.sortDiffsByAffectingHeightProperty);

    for (var diff of diffs) {
        setTimeout((function (diff) {
            try {
                if (diff.t == "a") {
                    addObject(diff);
                } else if (diff.t == "r") {
                    removeObject(diff);
                } else if (diff.t == 'c') {
                    var object = getObjectByUUID(MainScene, diff.i);
                    if (!object) {
                        throw 'No object'
                    }
                    diff.o.t = object.userData.type;
                    applyConfig(object, diff.o);
                }
            } catch (err) {
                console.log('Error:', err, diff, object);
            }
        }).bind(null, diff), 0)
    }

    if (Loader.getCharacterId() && !Loader.getCharacter() && getObjectByUUID(MainScene, Loader.getCharacterId())) {
        setTimeout(function () {
            var character = getObjectByUUID(MainScene, Loader.getCharacterId());
            Loader.setCharacter(character);
            Camera.position.set(character.position.x - 1.5, character.position.y + 3, character.position.z + 4.5);
            // make sure begin rendering is called after persistent object update
            setTimeout(() => { Signals.publish('beginRendering'); }, 0);
        }, 0)
    }

    setTimeout(function () {
        if (Loader.getCharacter()) {
            LocationHandler.updateObjectVisibility(Loader.getCharacter());
            Signals.publish('newTick');
        }
    }, 0)
}

var cachedDiffs = [];
Signals.subscribe('update', function (update) {

    var timestamp = update.t;
    var diffs = update.d;

    var delay = 0;
    if (timestamp) {
        var timeStampDiff = Date.now() - timestamp;
        timeStampDiffs.push(timeStampDiff);
        if (timeStampDiffs.length > 30) timeStampDiffs.shift();
        var worstCase = Utils.getThirdHighestValue(timeStampDiffs);
        delay = Math.max(worstCase - timeStampDiff, 0);
        delay = Math.min(500, delay);
    }

    if (!timestamp) {
        applyUpdate(diffs);
    } else {
        cachedDiffs.push(diffs);
        setTimeout(() => {
            applyUpdate(cachedDiffs[0]);
            cachedDiffs.shift()
        }, delay);
    }
});

Signals.subscribe('handleLogin', function (msg) {
    if (!msg.i) {
        return;
    }

    localStorage.setItem('ids', JSON.stringify([msg.i, msg.otp]));

    LocationHandler.clearCurrentSegments();
    cancel = false;
    Loader.setCharacterId(msg.i);
});

Signals.subscribe('disconnect', function (message) {
    cancel = true;
    Loader.setCharacter(null);
    Loader.setCharacterId(null);
    LocationHandler.clearCurrentSegments();

    timeStampDiffs = [];
    for (var i = MainScene.children.length - 1; i >= 0; i--) {
        var object = MainScene.children[i];
        if (object.userData.uuid) {
            removeObject({ i: object.userData.uuid, f: 1 })
        } else {
            if (object.name.startsWith('Seg-')) {
                object.removeFromParent();
            }
        }
    }

});

document.body.appendChild(LoadingBar.dom);
document.body.appendChild(LoginScreen.dom);
document.body.appendChild(CharacterEditor.dom);
document.body.appendChild(Tutorial.dom);
document.body.appendChild(Viewport.dom);
document.body.appendChild(Toolbar.dom);
document.body.appendChild(Inventory.dom);
document.body.appendChild(Chat.dom);
document.body.appendChild(Info.dom);
document.body.appendChild(Shop.dom);
document.body.appendChild(Bank.dom);
document.body.appendChild(Trade.dom);
document.body.appendChild(SmithingInterface.dom);
document.body.appendChild(InteractionsPopup.dom);
document.body.appendChild(QuestsPanel.dom);
document.body.appendChild(EquipmentPanel.dom);
document.body.appendChild(CollectionLogPanel.dom);
document.body.appendChild(FlashingArrow.dom);
document.body.appendChild(SettingsPanel.dom);
document.body.appendChild(ExperiencePanel.dom)

if (WebGL.isWebGL2Available()) {
    Loader.loadAssets();
} else {
    webglNotSupported();
}