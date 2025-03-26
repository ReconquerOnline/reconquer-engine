import { Vector3, Vector2, Quaternion, Raycaster } from 'three';
import { Config } from './Loader.js';
import { Image, Panel, Text } from './UI.js';

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function getObjectByUUID(object, uuid) {
    if (object.userData.uuid == uuid) return object;
    for (var i = 0, l = object.children.length; i < l; i++) {
        var child = object.children[i];
        var result = getObjectByUUID(child, uuid);
        if (result != undefined) {
            return result;
        }
    }
    return undefined;
}

export function getObjectByDisplayName(object, dn) {
    if (object.userData.state && object.userData.state.dn == dn) return object;
    for (var i = 0, l = object.children.length; i < l; i++) {
        var child = object.children[i];
        var result = getObjectByDisplayName(child, dn);
        if (result != undefined) {
            return result;
        }
    }
    return undefined;
}

export function getObjectByCid(object, cid) {
    if (object.userData.cid == cid) return object;
    for (var i = 0, l = object.children.length; i < l; i++) {
        var child = object.children[i];
        var result = getObjectByCid(child, cid);
        if (result != undefined) {
            return result;
        }
    }
    return undefined;
}

//
export function getObjectsByType(object, type, objects) {
    objects = objects ? objects : [];
    for (var i = 0, l = object.children.length; i < l; i++) {
        var child = object.children[i];
        if (child.userData.type == type) {
            objects.push(child)
        } else {
            getObjectsByType(child, type, objects);
        }
    }
    return objects;
}

export function getQuaternionFromRotation(rotation) {
    var angle = rotation * 90 / 180 * Math.PI;
    var direction = new Vector3(-Math.sin(angle), 0, Math.cos(angle));
    return new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0), Math.atan2(direction.x, direction.z));
}

export function raycastCamera(camera, objects, rectangle, x, y) {
    var raycaster = new Raycaster();
    var mouseX = ((x - rectangle.left) / rectangle.width) * 2 - 1;
    var mouseY = -((y - rectangle.top) / rectangle.height) * 2 + 1;
    raycaster.setFromCamera(new Vector2(mouseX, mouseY), camera);
    return raycaster.intersectObjects(objects, true);
};

export function absolutePointToGridPoint(x, y) {
    var worldX = Math.floor(x);
    var worldY = Math.floor(-y);
    var segX = 500 + Math.floor((worldX + 32) / 64);
    var segY = 500 + Math.floor((worldY + 32) / 64);
    var x = (((worldX + 32) % 64) + 64) % 64;
    var y = (((worldY + 32) % 64) + 64) % 64;
    return {
        segX: segX,
        segY: segY,
        x: x,
        y: y
    }
}

export function getDisplayName(data) {
    var displayName = data.state && data.state.dn ?
        data.state.dn :
        Config.definitions[data.type].itemName ?
            Config.definitions[data.type].itemName :
            '';
    var combatLevel = data.state && data.state.cbl ? data.state.cbl : null;

    if (data.state && data.state.ma) {
        displayName = displayName + '*';
    }
    if (combatLevel) {
        displayName = displayName + ' (Lvl-' + combatLevel + ')';
    }
    var info = {
        displayName: displayName,
        enemy: (data.state && data.state.en)
    }
    return info;
}

export function clearObject(obj) {
    obj.traverse(function (child) {
        if (child.material) {
            child.material.dispose();
            if (child.material.map) { child.material.map.dispose(); }
        } else if (child.geometry) {
            child.geometry.dispose();
        }
    });
    while (obj.children.length > 0) {
        obj.remove(obj.children[0]);
    }
}

export function formatItemQuantity(quantity) {
    if (quantity > 1000000) {
        return Math.floor(quantity / 1000000) + 'M'
    }
    if (quantity > 1000) {
        return Math.floor(quantity / 1000) + 'k'
    }
    return quantity;
}

export function getSpriteHeight(type) {
    var height = Config.definitions[type].spriteHeight;
    return height !== undefined ? height : 2;
}

export function getThirdHighestValue(arr) {
    if (arr.length < 3) return 0;

    var first = arr[0];
    var second = -Infinity;
    var third = -Infinity;
  
    for (var i = 1; i < arr.length; i++) {
      if (arr[i] > first) {
        third = second;
        second = first;
        first = arr[i];
      } else if (arr[i] > second && arr[i] !== first) {
        third = second;
        second = arr[i];
      } else if (arr[i] > third && arr[i] !== first && arr[i] !== second) {
        third = arr[i];
      }
    }
  
    return third;
}

export function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function svgToImage(svgString, callback) {
    callback = callback ? callback : () => { };
    var blob = new Blob([svgString], { type: 'image/svg+xml' });
    var imageUrl = URL.createObjectURL(blob);
    var image = new Image();
    image.dom.src = imageUrl;
    image.dom.onload = () => { URL.revokeObjectURL(imageUrl); callback(image) } ;
    return image;
}

export function svgToImageWithHighlight(svgString) {
    var blob = new Blob([svgString], { type: 'image/svg+xml' });
    var imageUrl = URL.createObjectURL(blob);
    var image = new Image();
    image.dom.width = 100;
    image.dom.height = 100;
    image.dom.src = imageUrl;
    image.dom.onload = () => {
        var canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        var ctx = canvas.getContext('2d');

        var offsetArray = [-1, -1, 0, -1, 1, -1, -1, 0, 1, 0, -1, 1, 0, 1, 1, 1];
        var scale = 4;
        for (var i = 0; i < offsetArray.length; i += 2) {
            ctx.drawImage(image.dom, offsetArray[i] * scale, offsetArray[i + 1] * scale, canvas.width, canvas.height);
        }

        // fill with color
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // draw original image in normal mode
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(image.dom, 0, 0, canvas.width, canvas.height);

        canvas.style.position = 'absolute'
        canvas.style.top = '0px'
        image.dom.onload = null;
        image.dom.src = canvas.toDataURL();

        () => URL.revokeObjectURL(imageUrl);
    }
    return image;
}

export function touchRightClick(element, callback) {
    var longPressTimeout;
    var touch = null;
    element.onTouchStart(function (event) {
        touch = event.touches[0];
        longPressTimeout = setTimeout(() => {
            callback({
                clientX: touch.pageX,
                clientY: touch.pageY,
                button: 2
            });
    }, 300);
    });
    element.onTouchMove(function (event) {
        var diffX = Math.abs(touch.pageX - event.touches[0].pageX);
        var diffY = Math.abs(touch.pageY - event.touches[0].pageY);
        if (diffX * diffX + diffY * diffY > 16) {
            clearTimeout(longPressTimeout);
        }
    })
    element.onTouchEnd(function (event) {
        clearTimeout(longPressTimeout);
    });
}

export function addToolTip(element, text, offset) {
    offset = offset ? offset : 0;
    var top = (-30 + offset) + 'px';
    var panel = new Panel()
        .setPosition('absolute')
        .setDisplay('none')
        .setOpacity(0.85)
        .setBorder('1px solid black')
        .setPadding('5px')
        .setBorderRadius('3px')
        .setBackgroundColor('#ffffff')
        .setWhiteSpace('nowrap')
        .setTop(top)
    var text = new Text()
        .setTextContent(text)
        .setDisplay('block');
        panel.add(text);
    element.add(panel);

    var timer;
    element.onMouseEnter(function () {
        timer = setTimeout(() => {
            panel.setDisplay('block')
        }, 400)
    })
    element.onMouseLeave(function (event) {
        panel.setDisplay('none');
        clearTimeout(timer);
    })
    return text;
}

export function extractFirstInt(str) {
    const match = str.match(/\d+/);
    if (match) {
        return parseInt(match[0], 10);
    } else {
        return NaN;
    }
}