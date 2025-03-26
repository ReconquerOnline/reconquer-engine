import { MainScene } from './Editor.js';
import * as Loader from './Loader.js';
import { Sprite, SpriteMaterial } from 'three';
import Viewport from './Viewport.js';

var spriteMaterial = new SpriteMaterial({
    sizeAttenuation: false,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    opacity: 0
});

var sprite = new Sprite(spriteMaterial);
sprite.renderOrder = 999;

var time = 0;

function showSprite(position, texture) {
    spriteMaterial.map = texture;
    spriteMaterial.needsUpdate = true;
    sprite.position.copy(position);

    var scaleFactor = 1200 / Viewport.dom.offsetHeight;
    sprite.scale.set(.02 * scaleFactor, .02 * scaleFactor, .02 * scaleFactor);
    MainScene.add(sprite);

    time = 0;
}

export function showRed(position) {
    var texture = Loader.Materials["RedXMaterial"].map;
    showSprite(position, texture);
}

export function showYellow(position) {
    var texture = Loader.Materials["YellowXMaterial"].map;
    showSprite(position, texture);
}

export function update(delta) {
    if (time > 300) {
        spriteMaterial.opacity = 0;
        return;
    };
    time += delta;
    spriteMaterial.opacity = Math.cos(Math.PI / 2 * time / 300);
}