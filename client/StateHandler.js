import * as Loader from './Loader.js';
import { AnimationMixer, LoopRepeat, LoopOnce } from 'three';
import * as Signals from './Signals.js';



function displayMesh(object, mesh, state) {
    var meshOptions = state.options;
    for (var meshName of meshOptions) {
        if (meshName == mesh) {
            var child = object.getObjectByName(meshName);
            child ? child.visible = true : null;
        } else {
            var child = object.getObjectByName(meshName);
            child ? child.visible = false : null;
        }
    }
}

function chooseMesh(object, value, state) {
    displayMesh(object, state.options[value], state);
}

function chooseMeshQuantity(object, value, state) {
    var meshOptions = state.options;
    var mesh = meshOptions[0];
    for (var meshName of meshOptions) {
        var quantity = Number(meshName.match(/\d/g).join(''));
        if (value >= quantity) {
            mesh = meshName;
        }
    }
    displayMesh(object, mesh, state);
}

function chooseMaterial(object, value, state) {
    var materialOptions = state.options;
    state.target.forEach(function (name) {
        var target = object.getObjectByName(name);
        target.traverse(function (child) {
            if (child.material && materialOptions.includes(child.material.name)) {
                child.material = Loader.Materials[materialOptions[value]];
            }
        });
    });
}

function chooseAnimation(object, value, state) {
    var animationOptions = state.options;
    if (!object.userData.mixer) {
        object.userData.mixer = new AnimationMixer(object);
        var mixer = object.userData.mixer;
        object.userData.animations = {};
        for (var animationObject of animationOptions) {
            var animation = Loader.GLTF.animations.filter(x => x.name == animationObject.useAnimation || x.name == animationObject.name)[0].clone();
            var startTime = 0;
            if (animationObject.randomOffset) {
                startTime = Math.random() * animationObject.duration / 0.6 * 0.5;
            }
            var action = mixer.clipAction(animation).reset().setLoop(LoopRepeat).setDuration(animationObject.duration / 0.6 * 0.5).play().fadeOut(0);
            if (!animationObject.loop) {
                action.setLoop(LoopOnce);
                action.clampWhenFinished = true;
            }
            object.userData.animations[animationObject.name] = action;
        }
    }

    // reset object state back in case meshes were hidden temporarily for the previous animation
    var chooseMeshes = Loader.Config.definitions[object.userData.type].state.filter(x => x.behavior == 'chooseMesh');
    for (var chooseMesh of chooseMeshes) {
        displayMesh(object, chooseMesh.options[object.userData.state[chooseMesh.id]], chooseMesh);
    }

    for (var animation in object.userData.animations) {
        var option = animationOptions[value];
        if (option.name == animation) {
            object.userData.animations[animation].reset().fadeIn(.15).play();
            if (Loader.getCharacterId() == object.userData.uuid) {
                Signals.publish('characterAnimationChange', value);
            }
            Signals.publish('animationChange', { object: object, option: option  })
            if (option.randomOffset) {
                var startTime = Math.random() * animationObject.duration / 0.6 * 0.5;
                object.userData.animations[animation].startAt(startTime);
            }
            // do particular overrides for animation
            if (option.overrideState) {
                for (var key in option.overrideState) {
                    var state = Loader.Config.definitions[object.userData.type].state.find(x => x.id == key);
                    displayMesh(object, state.options[option.overrideState[key]], state);
                }
            }
        } else if (object.userData.animations[animation].enabled) {
            object.userData.animations[animation].fadeOut(.15);
        }
    }
}

export function applyConfig(object, configState, actualState) {
    for (var state of configState) {
        var value = actualState[state.id];
        if (value == undefined) {
            continue;
        }
        object.userData.state[state.id] = value;
        if (state.behavior == 'chooseMesh') {
            chooseMesh(object, value, state);
        } else if (state.behavior == 'chooseMeshQuantity') {
            chooseMeshQuantity(object, value, state);
        } else if (state.behavior == 'chooseMaterial') {
            chooseMaterial(object, value, state);
        } else if (state.behavior == 'chooseAnimation') {
            chooseAnimation(object, value, state);
        }
    }
}