import Viewport from './Viewport.js';
import { Config, getCharacter, getCharacterId } from './Loader.js';
import { Sprite, SpriteMaterial, Texture } from 'three';

function generateTextSprite(message) {
    var fontface = "Arial";
    var fontSize = 36;
    var textColor = { r: 255, g: 255, b: 0, a: 1.0 };

    var width = 1024;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.canvas.height = width;
    context.canvas.width = width;
    context.font = "Bold " + fontSize + "px " + fontface;
    context.textAlign = 'center';
    context.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", 1.0)";
    context.fillText(message, width / 2, width / 2);

    var texture = new Texture(canvas)
    texture.needsUpdate = true;

    var spriteMaterial = new SpriteMaterial({ map: texture, sizeAttenuation: false });
    var sprite = new Sprite(spriteMaterial);
    var scaleFactor = 1200 / Viewport.dom.offsetHeight;
    sprite.scale.set(.75 * scaleFactor, .75 * scaleFactor, .75 * scaleFactor);
    return sprite;
}

export var TalkList = [];

export function handleMessage(object, message) {
    if (object.userData.messageSprite) {
        var oldSprite = object.userData.messageSprite;
        oldSprite.geometry.dispose();
        oldSprite.material.dispose();
        oldSprite.material.map.dispose();
        object.remove(oldSprite);
        object.userData.messageSprite = null;
    }
    if (message == '') return;

    if (getCharacter().userData.state.chat == 0) { return; }

    var badWords = Config.badWords;
    for (var word of badWords) {
		var regex = new RegExp(word, "g");
		message = message.replace(regex, "****");
    }

    // add to list of people you've seen talk
    TalkList.push(object.userData.uuid);

    var char = getCharacter();
    var blockList = localStorage.getItem(char.userData.uuid + '_blockList') ? JSON.parse(localStorage.getItem(char.userData.uuid + '_blockList')) : [];
    if (object.userData.uuid != getCharacterId() && blockList.indexOf(object.userData.uuid) != -1) {
        return;
    }

    var sprite = generateTextSprite(message);
    var height = Config.definitions[object.userData.type].spriteHeight;
    height = height !== undefined ? height : 2;
    sprite.position.setY(height);
    object.userData.messageSprite = sprite;
    object.add(sprite);
}