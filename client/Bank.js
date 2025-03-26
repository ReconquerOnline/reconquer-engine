import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { getCharacter, getCharacterId } from './Loader.js';
import { touchRightClick } from './Utils.js';
import * as Thumbnail from './Thumbnail.js';
import { formatItemQuantity } from './Utils.js';
import InteractionsPopup from './InteractionsPopup.js';
import * as Communication from './Communication.js';

const container = new Panel()
export default container;
container.setClass('Bank');

container.setWidth('400px')
    .setHeight('420px')
    .setPosition('absolute')
    .setBorderRadius('5px');
container.show = function () {
    container.setDisplay('block');
}
container.hide = function () {
    container.setDisplay('none');
}
container.isDisplayed = function () {
    return container.getDisplay() == 'block';
}
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 400) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 420) / 2;
    container.setBottom(bottom + 'px');
}
container.hide();


var headerPanel = new Panel()
    .setWidth('398px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var titlePanel = new Panel()
    .setHeight('18px')
    .setWidth('380px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextAlign('center')
headerPanel.add(titlePanel);

var closePanel = new Panel()
    .setHeight('18px')
    .setWidth('18px')
    .setPosition('absolute')
    .setTop('0px')
    .setRight('0px')
    .setTextContent('\u00d7')
    .setCursor('pointer');
headerPanel.add(closePanel)
closePanel.onClick(container.hide);

var isDragging = false;
var mouseX, startMouseX = 0;
var mouseY, startMouseY = 0;
var oldTop = 0;
var oldLeft = 0;

// do this because of firefox bug where event.clientX/Y is wrong
document.addEventListener('dragover', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY
});
var thumbnails = {};

function onDragEnd(thumbnail, oldTop, oldLeft) {
    if (!oldTop) {
        oldTop = thumbnail.getTop();
        oldLeft = thumbnail.getLeft();
    }

    var bounds = container.getBounds();
    var x = Math.floor((mouseX - bounds.x) / 50);
    var y = Math.floor((mouseY - bounds.y - 20) / 50);

    if (x > 7 || y > 7 || x < 0 || y < 0) {
        thumbnail
            .setLeft(oldLeft)
            .setTop(oldTop);
        return;
    };
    var newLeft = x * 50 + 'px';
    var newTop = (y * 50 + 20) + 'px';

    for (var i = 0; i < 64; i++) {
        var oldThumbnail = thumbnails[i];
        if (oldThumbnail &&
            oldThumbnail.getLeft() == newLeft &&
            oldThumbnail.getTop() == newTop) {
                oldThumbnail
                    .setLeft(oldLeft)
                    .setTop(oldTop);
        }
    }

    thumbnail
        .setLeft(newLeft)
        .setTop(newTop);

    // recalculate keys here because inventory may be out of sync
    var oldX = Number(oldLeft.slice(0, -2)) / 50;
    var oldY = (Number(oldTop.slice(0, -2)) - 20) / 50;

    var oldKey = 'bi' + (oldY * 8 + oldX);
    var swapKey = 'bi' + (y * 8 + x);
    Communication.swapBank(oldKey, swapKey);
}

var panels = {}
for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 8; c++) {
        var panel = new Panel()
            .setWidth('48px')
            .setHeight('48px')
            .setPosition('absolute')
            .setLeft(c * 50 + 'px')
            .setTop(20 + r * 50 + 'px')
            .setBackgroundColor('#ffffff')
            .setOpacity(0.7)
            .setBorder('1px solid #cccccc');
        if (c == 0) panel.setBorderLeft('0px solid').setWidth('49px')
        if (c == 7) panel.setBorderRight('0px solid').setWidth('49px')
        if (r == 7) panel.setBorderBottom('0px solid').setHeight('49px')
        panel.onDragOver(x => x.preventDefault());
        container.add(panel);
        panels[r * 8 + c] = panel;
    }
}

function handleClick(event, slot, itemId) {
    var interactions = [];

    var quantity = getCharacter().userData.state[slot][1];

    interactions.push({ type: 'withdraw', interaction: 'Withdraw' });
    if (quantity > 10) {
        interactions.push({ type: 'withdraw', interaction: 'Withdraw 10' });
    }
    if (quantity > 100) {
        interactions.push({ type: 'withdraw', interaction: 'Withdraw 100' });
    }
    if (quantity > 1000) {
        interactions.push({ type: 'withdraw', interaction: 'Withdraw 1000' });
    }
    interactions.push({ type: 'withdraw', interaction: 'Withdraw All' });
    interactions.push({ type: 'examine', interaction: 'Examine' }) 

    if (event.button == 2) {
        InteractionsPopup.create(event, {
            type: itemId,
            uuid: slot
        }, interactions);
        InteractionsPopup.setOpacity(0.85);
    } else {
        Communication.interact(slot, interactions[0]);
    }
}

function updateBank() {
    var character = getCharacter();

    titlePanel.setTextContent('Bank');
    for (var i = 0; i < 64; i++) {
        var slot = 'bi' + i;
        panels[i].setBackgroundColor('white')
        if (!character.userData.state[slot]) {
            panels[i].setBackgroundColor('#dddddd')
            continue;
        };
        if (thumbnails[i]) {
            if (thumbnails[i]) container.remove(thumbnails[i]);
            thumbnails[i] = null
        }
        var itemId = character.userData.state[slot][0];
        var quantity = character.userData.state[slot][1];
        if (!itemId) continue;
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft((i % 8) * 50 + 'px')
            .setTop(20 + Math.floor(i / 8) * 50 + 'px')
            .setPosition('absolute');
        var image = Thumbnail.generate(itemId, quantity)
            .setWidth('50px')
            .setHeight('50px')
            .setPosition('absolute')
            .setCursor('pointer');
        thumbnail.add(image);
        var number = new Text()
            .setTextContent(formatItemQuantity(quantity))
            .setColor('#555555')
            .setFontWeight('bold')
            .setPosition('absolute')
            .setBottom('2px')
            .setLeft('2px')
            .setFontSize('12px')
            .setBackgroundColor('#cccccc')
            .setBorderRadius('2px');
        thumbnail.add(number);
        container.add(thumbnail);
        ((slot, itemId, thumbnail) => {
            thumbnail.onMouseUp((event) => handleClick(event, slot, itemId));
            touchRightClick(thumbnail, (event) => handleClick(event, slot, itemId));

            thumbnail.onDragEnd(() => onDragEnd(thumbnail));
            thumbnail.onTouchStart(function(event) {
                isDragging = true;
                oldTop = thumbnail.getTop();
                oldLeft = thumbnail.getLeft();
                startMouseX = event.touches[0].pageX;
                startMouseY = event.touches[0].pageY;
                mouseX = event.touches[0].pageX;
                mouseY = event.touches[0].pageY;
            });
            thumbnail.onTouchMove(function(event) {
                if (isDragging) {
                    mouseX = event.touches[0].pageX;
                    mouseY = event.touches[0].pageY;
                    thumbnail.setTop(Number(oldTop.slice(0, -2)) + mouseY - startMouseY + 'px');
                    thumbnail.setLeft(Number(oldLeft.slice(0, -2)) + mouseX - startMouseX + 'px');
                }
            });
            thumbnail.onTouchEnd(function(event) {
                if (isDragging) {
                    isDragging = false;
                    onDragEnd(thumbnail, oldTop, oldLeft);
                }
            });
        })(slot, itemId, thumbnail);
        thumbnails[i] = thumbnail;
    }
}

function handleBankChange(object, actualState) {
    var update = false;
    for (var i = 0; i < 64; i++) {
        var slot = 'bi' + i;
        if (!actualState[slot]) continue;
        object.userData.state[slot] = actualState[slot];
        update = true;
    }

    var character = getCharacter();
    if (update && character) {
        updateBank(object.userData.uuid);
    }

    if (object.userData.uuid != getCharacterId()) return;
    if (actualState.msb === undefined) return;

    var showShop = actualState.msb !== undefined ? actualState.msb : object.userData.state.msb;

    if (character && showShop) {
        updateBank();
        container.show();
        container.onResize();
    }
    object.userData.state.msb = showShop;
}
container.handleBankChange = handleBankChange;

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('viewportClick', container.hide);
Signals.subscribe('disconnect', container.hide);
Signals.subscribe('characterMove', container.hide);