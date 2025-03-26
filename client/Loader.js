import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { LoadingManager, FileLoader, DataTexture, RepeatWrapping, SRGBColorSpace, LinearMipmapLinearFilter, LinearFilter } from 'three';
import * as Signals from './Signals.js';
import { InventoryEnvironment, Environment, ChatEnvironment, LoginScreenEnvironment } from './Editor.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export var Config = {};
export var GLTF = {};
export var Materials = {};
export var InventoryMaterials = {};
export var ChatMaterials = {};
export var LoginScreenMaterials = {};
export var Segments = {};
export var PersistentUUIDs = {};
export var EquipmentNameToSlots = {};
export var LocalInstanceToUUID = {};
export var LocalInstanceParameters = {};
export var SVG = {};
export var Music = {};
export var SoundEffects = {};
export var Textures = {};

var loadingProgressMap = {};
function loadingProgress(name, progress) {
    var loaded = progress.loaded;
    var total = progress.total;
    loadingProgressMap[name] = [loaded, total];

    var overallTotal = 0;
    var overallLoaded = 0;
    for (var key in loadingProgressMap) {
        var value = loadingProgressMap[key];
        overallLoaded += value[0];
        overallTotal += value[1];
    }
    Signals.publish('assetsLoading', overallLoaded / overallTotal);
}

export var svgTextures = {};

export function svgToTexture(svgData, name) {
    if (svgTextures[svgData]) {
        return svgTextures[svgData];
    }

    var size = 1024;
    // special case for sky
    if (name == 'sky') {
        size = 4096;
    }
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');  
    var img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    var promise = new Promise((resolve) => {
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            var imageData = ctx.getImageData(0, 0, size, size);
            var texture = new DataTexture(imageData.data, size, size);
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.colorSpace = SRGBColorSpace;
            texture.needsUpdate = true;
            texture.minFilter = LinearMipmapLinearFilter;
            texture.magFilter = LinearFilter;
            resolve(texture);
        };
    });
    svgTextures[svgData] = promise;
    return promise;
}

function applyEnvironmentMap(material, environment) {
    if (material.metalness > .5) {
        material.envMap = environment;
        material.envMapIntensity = .7;
    }
}

function handleTexture(object) {
    if (object.material.map && object.material.map.isTexture) {
        Textures[object.material.map.name] = object.material.map;
    }
    if (object.material.emissiveMap && object.material.emissiveMap.isTexture) {
        Textures[object.material.emissiveMap.name] = object.material.emissiveMap;
    }
    if (object.material.normalMap && object.material.normalMap.isTexture) {
        Textures[object.material.normalMap.name] = object.material.normalMap;
    }
    if (object.material.aoMap && object.material.aoMap.isTexture) {
        Textures[object.material.aoMap.name] = object.material.aoMap;
    }
}

function createSVGTextures(object, callback) {
    var texturesToLoad = 0;
    var texturesLoaded = 0;
    if (object.material.userData.baseColorTexture) {
        texturesToLoad += 1;
        var svg = SVG[object.material.userData.baseColorTexture];
        svgToTexture(svg, object.name).then((texture) => {
            Textures[object.material.userData.baseColorTexture] = texture;
            object.material.map = texture;
            object.material.needsUpdate = true;
            texturesLoaded += 1;
            if (texturesToLoad == texturesToLoad) callback();
        });
    }
    if (object.material.userData.emissiveTexture) {
        texturesToLoad += 1;
        var svg = SVG[object.material.userData.emissiveTexture];
        svgToTexture(svg, object.name).then((texture) => {
            Textures[object.material.userData.emissiveTexture] = texture;
            object.material.emissiveMap = texture;
            object.material.needsUpdate = true;
            texturesLoaded += 1;
            if (texturesToLoad == texturesToLoad) callback();
        });
    }
    if (object.material.userData.normalTexture) {
        texturesToLoad += 1;
        var svg = SVG[object.material.userData.normalTexture];
        svgToTexture(svg, object.name).then((texture) => {
            Textures[object.material.userData.normalTexture] = texture;
            object.material.normalMap = texture;
            object.material.needsUpdate = true;
            texturesLoaded += 1;
            if (texturesToLoad == texturesToLoad) callback();
        });
    }
    if (object.material.userData.occlusionTexture) {
        texturesToLoad += 1;
        var svg = SVG[object.material.userData.occlusionTexture];
        svgToTexture(svg, object.name).then((texture) => {
            Textures[object.material.userData.occlusionTexture] = texture;
            object.material.aoMap = texture;
            object.material.needsUpdate = true;
            texturesLoaded += 1;
            if (texturesToLoad == texturesToLoad) callback();
        });
    }
    if (texturesToLoad == texturesToLoad) callback();
}

var materialToEmissiveMap = {
    'FurnaceFireMaterial': 6.4,
    'FireTextureMaterial': 7,
    'FireSpoutTextureMaterial': 7,
    'StoveFireMaterial': 5.5,
    'LavaMaterial': 13.4,
    "LighteningMaterial": 6
}

function addMaterial(object, cb) {
    if (object.material && !Materials[object.material.name]) {
        if (materialToEmissiveMap[object.material.name]) {
            object.material.emissiveIntensity = materialToEmissiveMap[object.material.name]
        }
        Materials[object.material.name] = true;
        
        createSVGTextures(object, () => {
            var name = object.material.name;
            Materials[name] = object.material;
            if (object.material.opacity < 1) {
                object.material.transparent = true;
            }

            handleTexture(object);

            InventoryMaterials[name] = object.material.clone();
            ChatMaterials[name] = object.material.clone();
            LoginScreenMaterials[name] = object.material.clone();
            applyEnvironmentMap(Materials[name], Environment);
            applyEnvironmentMap(InventoryMaterials[name], InventoryEnvironment);
            applyEnvironmentMap(ChatMaterials[name], ChatEnvironment);
            applyEnvironmentMap(LoginScreenMaterials[name], LoginScreenEnvironment);
            cb();
        })
    } else {
        cb();
    }
}

export function loadMaterials(scene, callback) {
    var numLoaded = 0;
    var numToload = 0;
    scene.children.forEach(function (child) {
        child.traverse((obj) => {
            numToload += 1;
            setTimeout(() => {
                addMaterial(obj, () => {
                    numLoaded += 1;
                    if (numToload == numLoaded) {
                        callback()
                    }
                });
            }, 0)
        });
        if (child.name.startsWith('Seg-')) {
            child.updateWorldMatrix(true, true);
            Segments[child.name] = child;
        }
    });
}

export function loadAssets() {

    // change this when loading a new asset
    var ASSETS_TO_LOAD = 5;

    var loadedAssets = {}
    function markLoaded(key) {
        loadedAssets[key] = true;
        if (Object.keys(loadedAssets).length == ASSETS_TO_LOAD) {
            Signals.publish('assetsLoaded');
        }
    }

    const manager = new LoadingManager();
    manager.onStart = function (url, itemsLoaded, itemsTotal) {
        //console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    };

    manager.onLoad = function () {
        // console.log('loaded')
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) {
        //console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
    };

    manager.onError = function (url) {
        console.log('There was an error loading ' + url);
    };

    async function compressedBlobToText(blob) {
        var decompressor = new DecompressionStream("gzip");
        var decompressionStream = blob.stream().pipeThrough(decompressor);
        var decompressedBlob = await new Response(decompressionStream).blob();
        return await decompressedBlob.text();
    }

    var fileLoader = new FileLoader(manager).setResponseType('blob');
    fileLoader.load('/dist/assets/client_config.json.zip?v=' + BUILD_VERSION, async function (blob) {
        var text = await compressedBlobToText(blob);
        Config = JSON.parse(text);
        for (var segName in Config.hierarchy) {
            Config.hierarchy[segName].forEach((x) => {
                PersistentUUIDs[x.i] = true;
                if (x.id) {
                    LocalInstanceToUUID[x.id] = x.i;
                    for (var stateObject of Config.definitions[x.t].state) {
                        LocalInstanceParameters[x.id + '.' + stateObject.id] = { uniqueId: x.id, stateId: stateObject.id };
                    }
                }
            });
        }
        for (var state of Config.definitions.character.state) {
            if (!state.slot) continue;
            for (var option of state.options) {
                if (!option) continue;
                EquipmentNameToSlots[option] = state.slot;
            }
        }
        markLoaded('client_config.json')
    }, loadingProgress.bind(null, 'client_config.json'));


    fileLoader.load('/dist/assets/svg.json.zip?v=' + BUILD_VERSION, async function (blob) {
        var text = await compressedBlobToText(blob);
        SVG = JSON.parse(text);
        markLoaded('svg.json');

        fileLoader.load('/dist/assets/assets.glb.zip?v=' + BUILD_VERSION, async function (blob) {
            var gltfLoader = new GLTFLoader(manager);
    
            var decompressor = new DecompressionStream("gzip");
            var decompressionStream = blob.stream().pipeThrough(decompressor);
            var decompressedBlob = await new Response(decompressionStream).blob();
            var arrayBuffer = await decompressedBlob.arrayBuffer();

            gltfLoader.parse(arrayBuffer, '', (gltf) => {
                GLTF = gltf;
                loadMaterials(gltf.scene, () => { markLoaded('assets.glb') })
                
            }, (err) => {
                console.log(err)
            });
        }, loadingProgress.bind(null, 'assets.glb'));

    }, loadingProgress.bind(null, 'svg.json'));

    fileLoader.load('/dist/assets/music.json.zip?v=' + BUILD_VERSION, async function (blob) {
        var text = await compressedBlobToText(blob);
        Music = JSON.parse(text);
        markLoaded('music.json')
    }, loadingProgress.bind(null, 'music.json'));

    fileLoader.load('/dist/assets/sound_effects.json.zip?v=' + BUILD_VERSION, async function (blob) {
        var text = await compressedBlobToText(blob);
        var obj = JSON.parse(text);
        for (var key in obj) {
            var binaryString = atob(obj[key]);
            var bytes = new Uint8Array(binaryString.length);
            for (var i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            ((key, bytes) => {
                var audioContext = new AudioContext();
                audioContext.decodeAudioData(bytes.buffer)
                .then(audioBuffer => {
                    SoundEffects[key] = {
                        context: audioContext,
                        buffer: audioBuffer
                    };
                })
                .catch(error => {
                    console.error('Error decoding audio data:', error);
                });
    
                
            })(key, bytes);

        }
        markLoaded('sound_effects.json');
    }, loadingProgress.bind(null, 'sound_effects.json'));
}

var character = null;
var characterId = null;
export function setCharacterId(id) {
    characterId = id;
}

export function getCharacterId() {
    return characterId;
}

export function setCharacter(newCharacter) {
    character = newCharacter;
};

export function getCharacter() {
    return character;
}

var objectsAffectingHeight = {};

export function addObjectAffectingHeight(object) {
    var idString = object.userData.state.lsx + '-' + object.userData.state.lsy + '-' + object.userData.state.lf;
    if (!objectsAffectingHeight[idString]) {
        objectsAffectingHeight[idString] = [];
    }
    if (objectsAffectingHeight[idString].find(x => x.userData.uuid == object.userData.uuid)) {
        return;
    }
    objectsAffectingHeight[idString].push(object);
    object.updateWorldMatrix(true, true);
}

export function removeObjectAffectingHeight(object) {
    if (!object.userData.state) return;
    var idString = object.userData.state.lsx + '-' + object.userData.state.lsy + '-' + object.userData.state.lf;
    var array = objectsAffectingHeight[idString];
    if (!array) return;
    var index = array.indexOf(object);
    if (index > -1) {
        array.splice(index, 1);
    }
}

export function getObjectsAffectingHeight(segmentX, segmentY, floor) {
    var idString = segmentX + '-' + segmentY + '-' + floor;
    if (!objectsAffectingHeight[idString]) {
        return [];
    }
    return objectsAffectingHeight[idString];
}

export function sortDiffsByAffectingHeightProperty(a, b) {
    var addingA = a.t == 'a';
    var addingB = b.t == 'a';
    if (addingA && !addingB) {
        return -1;
    }
    if (!addingA && addingB) {
        return 1;
    }
    if (!addingA && !addingB) {
        return 0;
    }
    var configA = Config.definitions[a.o.t];
    var configB = Config.definitions[b.o.t];

    var isFloorA = a.o.t.includes('floor');
    var isFloorB = b.o.t.includes('floor');

    if (isFloorA && !isFloorB) {
        return -1;
    }
    if (isFloorB && !isFloorA) {
        return 1;
    }

    var affectsHeightA = configA && configA.affectsHeight;
    var affectsHeightB = configB && configB.affectsHeight;
    if (affectsHeightA && !affectsHeightB) {
        return -1;
    }
    if (affectsHeightB && !affectsHeightA) {
        return 1;
    }
    return 0;
}

function replaceMaterials(object, id) {
    var replacements = Config.definitions[id] && Config.definitions[id].replaceMaterials ? Config.definitions[id].replaceMaterials : null;
    if (!replacements) return;

    for (var oldMaterial in replacements) {
        var replacement = replacements[oldMaterial];
        object.traverse(function (child) {
            if (child.material && child.material.name == oldMaterial) {
                child.material = Materials[replacement];
            }
        });
    }
}

function handleCopies(object) {
    var objectsToCopy = [];
    object.traverse(function (child) {
        if (!child.name.includes("copy")) return;
        objectsToCopy.push(child);
    });
    // copy all geometries
    var newGeometries = {};
    for (var child of objectsToCopy) {
        var parent = child.parent;
        var matrixWorld = child.matrixWorld;
        child.removeFromParent();
        var parentChildren = parent.children;
        parent.children = parentChildren.filter(x => x.name != parent.name && !x.name.includes("copy"));
        var copy = parent.clone();
        copy.traverse((child) => {
            if (child.geometry) {
                var newGeometry = child.geometry.clone().applyMatrix4(matrixWorld);
                newGeometries[child.name] = newGeometries[child.name] ? newGeometries[child.name] : [];
                newGeometries[child.name].push(newGeometry);
            }
        })
        parent.children = parentChildren;
    }
    object.traverse(function (child) {
        if (!newGeometries[child.name]) return;
        newGeometries[child.name].push(child.geometry);
        var newGeometry = BufferGeometryUtils.mergeGeometries(newGeometries[child.name]);
        child.geometry = newGeometry;
    });
}

function handleImports(object) {
    var objectsToImport = [];
    object.traverse(function (child) {
        if (!child.name.includes("import")) return;
        objectsToImport.push(child);
    });
    for (var child of objectsToImport) {
        var parent = child.parent;
        var matrixWorld = child.matrixWorld;
        child.removeFromParent();
        var nameArray = child.name.split('_');
        var importIndex = nameArray.indexOf('import')
        var assetToImport = nameArray.slice(importIndex + 1).join('_').replace(/\d+/g, '');
        var asset = getAssetById(assetToImport);
        asset.applyMatrix4(matrixWorld)
        parent.add(asset);
    }
}

export function getAssetById(id) {
    var mesh = Config.definitions[id] && Config.definitions[id].replaceMesh ? Config.definitions[id].replaceMesh : id;
    var asset = GLTF.scene.getObjectByName(mesh);
    if (!asset) console.log('Failed to find', id);
    var clone = SkeletonUtils.clone(asset);

    if (Config.definitions[id] && Config.definitions[id].hideMeshes) {
        clone.traverse(function (child) {
            if (Config.definitions[id].hideMeshes.indexOf(child.name) != -1) {
                child.visible = false;
            }
        })
    }

    replaceMaterials(clone, id);
    handleCopies(clone);
    handleImports(clone);
    if (Config.definitions[id] && Config.definitions[id].shiftMesh) {
        var shift = Config.definitions[id].shiftMesh;
        if (clone.geometry) {
            clone.geometry = clone.geometry.clone();
            clone.geometry.translate(shift[0], shift[1], shift[2]);
        }
    }
    if (Config.definitions[id] && Config.definitions[id].scaleMesh) {
        var scale = Config.definitions[id].scaleMesh;
        if (typeof scale == 'number') {
            clone.scale.multiplyScalar(scale);
        } else {
            clone.scale.fromArray(scale);
        }
        
    }
    if (Config.definitions[id] && Config.definitions[id].frustumCulled !== undefined) {
        clone.frustumCulled = Config.definitions[id].frustumCulled;
        clone.traverse(function (child) {
            child.frustumCulled = Config.definitions[id].frustumCulled;
        })
    }
    return clone;
}