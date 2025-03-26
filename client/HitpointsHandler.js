import { Sprite, SpriteMaterial, Texture } from 'three';
import Viewport from './Viewport.js';
import { svgToImage } from './Utils.js';
import * as Signals from './Signals.js';
import { SVG } from './Loader.js';
import { Config } from './Loader.js';

function generateHitsplat(change, yHeight, parent) {
    if (change >= 0) return;

    var width = 256;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    context.canvas.height = width;
    context.canvas.width = width;

    var svg = SVG['hitsplat.svg'].replace('%NUM%', Math.abs(change));
    svgToImage(svg, function (img) {
        
        context.drawImage(img.dom, 0, 0);

        var texture = new Texture(canvas)
        texture.needsUpdate = true;
    
        var spriteMaterial = new SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, depthWrite: false });
        var sprite = new Sprite(spriteMaterial);
        var scaleFactor = 1200 / Viewport.dom.offsetHeight / 10;
        sprite.scale.set(.4 * scaleFactor, .4 * scaleFactor, .4 * scaleFactor);
        
        sprite.position.setY(yHeight)
        cleanHitsplat(parent)
        parent.userData.hitsplat = sprite;
        parent.add(sprite)
    });
}

function generateSprite(hp, maxHp) {
    var width = 256;

    hp = Math.min(hp, maxHp)

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.canvas.height = width;
    context.canvas.width = width;
    context.beginPath();
    context.lineWidth = "4";
    context.fillStyle = "#c0392b";
    context.fillRect(28, 128, 200, 20);
    context.fillStyle = "#27ae60";
    context.fillRect(28, 128, 200 * hp / maxHp, 20);
    context.strokeStyle = "#2c3e50";
    context.rect(28, 128, 200, 20);
    context.stroke();

    var texture = new Texture(canvas)
    texture.needsUpdate = true;

    var spriteMaterial = new SpriteMaterial({ map: texture, sizeAttenuation: false });
    var sprite = new Sprite(spriteMaterial);
    var scaleFactor = 1200 / Viewport.dom.offsetHeight / 10;
    sprite.scale.set(.75 * scaleFactor, .75 * scaleFactor, .75 * scaleFactor);
    return sprite;
}

function cleanSprite(object) {
    var oldSprite = object.userData.hitpointsSprite;
    if (!oldSprite) return;
    oldSprite.geometry.dispose();
    oldSprite.material.dispose();
    oldSprite.material.map.dispose();
    object.remove(oldSprite);
    object.userData.hitpointsSprite = null;
}

function cleanHitsplat(object) {
    var oldSprite = object.userData.hitsplat;
    if (!oldSprite) return;
    oldSprite.geometry.dispose();
    oldSprite.material.dispose();
    oldSprite.material.map.dispose();
    object.remove(oldSprite);
    object.userData.hitsplat = null;
}

export function handleUpdate(object, actualState) {

    if (actualState.mhp === undefined && actualState.hp === undefined) return;

    var hitpoints = actualState.hp !== undefined ? actualState.hp : object.userData.state.mhp;
    var maxHitpoints = actualState.mhp !== undefined ? actualState.mhp : object.userData.state.mhp;

    if (object.userData.hitpointsSprite) {
        cleanSprite(object);
    }

    if (object.userData.state.hp && object.userData.state.hp != hitpoints) {
        
        if (hitpoints < object.userData.state.hp) {
            Signals.publish('hitpointDecrease', object)
        }
        if (hitpoints < maxHitpoints) {
            var sprite = generateSprite(hitpoints, object.userData.state.mhp);
            var height = object.userData.height;
            if (Config.definitions[object.userData.type].spriteHeight) {
                height = Config.definitions[object.userData.type].spriteHeight;
            }
            sprite.position.setY(height + .3);
            object.userData.hitpointsSprite = sprite;
            object.add(sprite);
        }

        generateHitsplat(hitpoints - object.userData.state.hp, height / 2, object)

        setTimeout(() => {
            clearTimeout(object.userData.hitpointsTimeout);
            object.userData.hitpointsTimeout = setTimeout(cleanSprite.bind(null, object), 5000);

            clearTimeout(object.userData.hitsplatTimeout);
            object.userData.hitsplatTimeout = setTimeout(cleanHitsplat.bind(null, object), 600);
        }, 0)
    }
    object.userData.state.hp = hitpoints;
    object.userData.state.mhp = maxHitpoints;
}