import { Image } from './UI.js';
import { InventoryRenderer } from './Editor.js';
import * as StateHandler from './StateHandler.js';
import { getAssetById, InventoryMaterials } from './Loader.js';
import * as Loader from './Loader.js';
import { AmbientLight, Box3, DirectionalLight, OrthographicCamera, Scene, Vector3 } from 'three';

export function generate(id, quantity, highlight) {
    var scene = new Scene();
    var definition = Loader.Config.definitions[id];

    var clone = getAssetById(id);
    clone.userData.state = {};
    clone.traverse((obj) => {
        if (obj.geometry) {
            obj.geometry = obj.geometry.clone();
            if (definition.rotateThumbnail) obj.geometry.rotateX(Math.PI / 2);
            obj.geometry.rotateY(Math.PI / 8);
            obj.geometry.rotateX(Math.PI / 8);
        }
        if (obj.material) {
            obj.material = InventoryMaterials[obj.material.name];
        }
    });
    // apply quantity
    if (definition.state) {
        var configState = definition.state;
        var actualState = { q: quantity };
        StateHandler.applyConfig(clone, configState, actualState);
    }

    scene.add(clone);
    var box = new Box3().expandByObject(clone);
    var sizeX = Math.abs(box.min.x - box.max.x) / 2;
    var sizeY = Math.abs(box.min.y - box.max.y) / 2;
    var size = sizeX > sizeY ? sizeX : sizeY;
    var midHeight = (box.min.y + box.max.y) / 2;
    var midWidth = (box.min.x + box.max.x) / 2;

    var camera = new OrthographicCamera(-size * 1.2, size * 1.2, size * 1.2, -size * 1.2, 0.1, 10);
    camera.position.x = midWidth;
    camera.position.y = midHeight;
    camera.position.z = 1;
    camera.lookAt(new Vector3(midWidth, midHeight, 0))
    scene.add(camera);

    var ambientLight = new AmbientLight(0xbbbbbb, Math.PI);
    scene.add(ambientLight);
    var directionalLight = new DirectionalLight(0xffffff, Math.PI/2);
    directionalLight.position.z = 1;
    directionalLight.position.x = .2;
    scene.add(directionalLight);

    InventoryRenderer.render(scene, camera);
    var imgData = InventoryRenderer.domElement.toDataURL();
    var img = new Image();

    if (highlight) {
        img.dom.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            var ctx = canvas.getContext('2d');

            var offsetArray = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1];
            var scale = 2;
            for (var i = 0; i < offsetArray.length; i += 2) {
                ctx.drawImage(img.dom, offsetArray[i] * scale, offsetArray[i + 1] * scale);
            }

            // fill with color
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // draw original image in normal mode
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(img.dom, 0, 0);

            canvas.style.position = 'absolute'
            canvas.style.top = '0px'
            img.dom.onload = null;
            img.dom.src = canvas.toDataURL();
        };
    }

    img.dom.src = imgData;
    return img;
}