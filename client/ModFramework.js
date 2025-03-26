import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTF, loadMaterials, Materials, Music, Segments, SoundEffects, SVG, svgTextures, Textures } from "./Loader";
import { cache } from "./LocationHandler";
import * as Communication from './Communication.js';

export function loadModFile(file) {
    // clear location cache
    Object.keys(cache).forEach(key => delete cache[key]);
    Object.keys(svgTextures).forEach(key => delete svgTextures[key]);
    Object.keys(Textures).forEach(key => delete Textures[key]);
    Object.keys(Materials).forEach(key => delete Materials[key]);
    var numToLoad = 0;
    var numLoaded = 0;
    function checkComplete() {
        if (numLoaded == numToLoad) {
            // reload all materials
            loadMaterials(GLTF.scene, () => {
                
            })
        }
    }

    JSZip.loadAsync(file).then(function (zip) {
        Communication.logout();
        zip.forEach(function (relativePath, zipEntry) {
            var fileName = relativePath.split('/').pop();
            if (!zipEntry.dir) {
                numToLoad += 1;
                if (fileName.endsWith('.svg')) {
                    zipEntry.async("text").then(function (content) {
                        SVG[fileName] = content;
                        // need to update materials...
                        numLoaded += 1;
                        checkComplete();
                    });
                } else if (fileName.endsWith('.mid')) {
                    zipEntry.async("base64").then(function (content) {
                        Music[fileName] = content;
                        numLoaded += 1;
                        checkComplete();
                    });
                } else if (fileName.endsWith('.ogg')) {
                    zipEntry.async("arraybuffer").then(function (content) {
                        var audioContext = new AudioContext();
                        audioContext.decodeAudioData(content)
                            .then(audioBuffer => {
                                SoundEffects[fileName] = {
                                    context: audioContext,
                                    buffer: audioBuffer
                                };
                                numLoaded += 1;
                                checkComplete();
                            })
                            .catch(error => {
                                console.error('Error decoding audio data:', error);
                            });

                    });
                } else if (fileName.endsWith('.glb')) {
                    zipEntry.async("arraybuffer").then(function (content) {
                        var gltfLoader = new GLTFLoader();
                        gltfLoader.parse(content, '', (gltf) => {
                            for (var animation of gltf.animations) {
                                GLTF.animations = GLTF.animations.filter(item => item.name !== animation.name)
                                GLTF.animations.push(animation);
                            }
                            for (var child of gltf.scene.children) {
                                GLTF.scene.children.forEach(function (oldChild) {
                                    if (child.name == oldChild.name) {
                                        GLTF.scene.remove(oldChild)
                                        GLTF.scene.add(child)
                                    }
                                    if (child.name.startsWith('Seg-')) {
                                        child.updateWorldMatrix(true, true);
                                        Segments[child.name] = child;
                                    }
                                });
                            }
                            numLoaded += 1;
                            checkComplete();
                        })
                    })

                } else {
                    numLoaded += 1;
                    checkComplete();
                }
            }
        });
    }).catch(function(error) {
        console.error("Error reading ZIP file:", error);
    });
}