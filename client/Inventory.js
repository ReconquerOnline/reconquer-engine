import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Chat from './Chat.js';
import { getCharacterId, getCharacter } from './Loader.js';
import * as Communication from './Communication.js';
import * as Thumbnail from './Thumbnail.js';
import * as Loader from './Loader.js';
import InteractionsPopup from './InteractionsPopup.js';
import { formatItemQuantity, touchRightClick } from './Utils.js';
import Shop from './Shop.js';
import Trade from './Trade.js';
import Bank from './Bank.js';
import { svgToImage, svgToImageWithHighlight } from './Utils.js';
import { SVG, Config } from './Loader.js';

const container = new Panel()
export default container;
container.setClass('Inventory');

Chat.decorate(container);
container.hide();

for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 12; c++) {
        var panel = new Panel()
            .setWidth('48px')
            .setHeight('48px')
            .setPosition('absolute')
            .setLeft(c * 50 + 'px')
            .setTop(r * 50 + 'px')
            .setBackgroundColor('#ffffff')
            .setOpacity(0.5)
            .setBorder('1px solid #cccccc');
        if (c == 0) panel.setBorderLeft('0px solid').setWidth('49px')
        if (c == 11) panel.setBorderRight('0px solid').setWidth('49px')
        if (r == 0) panel.setBorderTop('0px solid').setHeight('49px')
        if (r == 2) panel.setBorderBottom('0px solid').setHeight('49px')
        if (c > 7) panel.setBackgroundColor('#eeeeee');
        panel.onDragOver(x => x.preventDefault());
        panel.onClick(x => clearUseArray())
        container.add(panel);
    }
}

export var inventory = {};

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

function onDragEnd(thumbnail, oldTop, oldLeft) {
    if (!oldTop) {
        oldTop = thumbnail.getTop();
        oldLeft = thumbnail.getLeft();
    }

    var bounds = container.getBounds();
    var x = Math.floor((mouseX - bounds.x) / 50);
    var y = Math.floor((mouseY - bounds.y) / 50);

    // recalculate keys here because inventory may be out of sync
    var oldX = Number(oldLeft.slice(0, -2)) / 50;
    var oldY = Number(oldTop.slice(0, -2)) / 50;
    var oldKey = 'i' + (oldY * 8 + oldX);
    var swapKey = 'i' + (y * 8 + x);

    // if same, don't do any update
    if(getCharacter().userData.state[oldKey][0] == getCharacter().userData.state[swapKey][0]) return;

    if (x > 7 || y > 2 || x < 0 || y < 0) {
        thumbnail
            .setLeft(oldLeft)
            .setTop(oldTop);
        return;
    };
    var newLeft = x * 50 + 'px';
    var newTop = y * 50 + 'px';

    for (var i = 0; i < 24; i++) {
        var oldThumbnail = inventory[i];
        if (oldThumbnail &&
            oldThumbnail.getLeft() == newLeft &&
            oldThumbnail.getTop() == newTop) {
            if (oldThumbnail.itemId == thumbnail.itemId) return;
            oldThumbnail
                .setLeft(oldLeft)
                .setTop(oldTop);
        }
    }

    thumbnail
        .setLeft(newLeft)
        .setTop(newTop);

    Communication.swapInventory(oldKey, swapKey);
}

export var UseArray = [];
export function clearUseArray() {
    for (var id of UseArray) {
        var character = Loader.getCharacter();
        var state = {};
        state[id] = character.userData.state[id];
        container.handleInventoryChange(character, state, false);
    }
    UseArray = [];
}
Signals.subscribe('useItem', function (id) {
    UseArray.push(id);
    var character = Loader.getCharacter();
    var state = {};
    state[id] = character.userData.state[id];
    container.handleInventoryChange(character, state, true);
});

function handleClick(event, key, itemId) {
    var interactions = [];
    if (UseArray.length > 0) {
        if (UseArray.includes(key)) {
            clearUseArray();
        } else {
            interactions = [{ type: 'on', interaction: 'On' }];
            if (UseArray.length < 4) {
                interactions.push({ type: 'use', interaction: 'Use' });
            }
        }
    } else {
        interactions = JSON.parse(JSON.stringify(Loader.Config.definitions[itemId].inventoryInteractions));
        // if multiple of item id, then add "Drop All" interaction
        var count = 0;
        for (var i = 0; i < 24; i++) {
            if (inventory[i] && itemId == inventory[i].itemId[0]) count += 1;
            if (count > 1) {
                interactions.push({ type: 'drop', interaction: 'Drop All' });
                break;
            }
        }
    }

    var amount = 0;
    for (var i = 0; i < 24; i++) {
        if (getCharacter().userData.state['i' + i][0] == itemId) {
            amount += getCharacter().userData.state['i' + i][1]
        }
    }
    if (Shop.isDisplayed() && Shop.getInventoryInteractions(amount)) {
        interactions = Shop.getInventoryInteractions(amount);
    }

    if (Trade.isDisplayed()) {
        interactions = [
            { type: 'offer', interaction: 'Offer' },
        ];
        amount > 1 ? interactions.push({ type: 'offer', interaction: 'Offer 10' }) : null;
        amount > 10 ? interactions.push({ type: 'offer', interaction: 'Offer 100' }) : null;
        amount > 100 ? interactions.push({ type: 'offer', interaction: 'Offer 1000' }) : null;
        amount > 1000 ? interactions.push({ type: 'offer', interaction: 'Offer 10k' }) : null;
        amount > 10000 ? interactions.push({ type: 'offer', interaction: 'Offer 100k' }) : null;
        interactions.push({ type: 'examine', interaction: 'Examine' });
    }

    if (Bank.isDisplayed()) {
        interactions = [];
        interactions.push({ type: 'deposit', interaction: 'Deposit' });
        amount > 10 ? interactions.push({ type: 'deposit', interaction: 'Deposit 10' }) : null;
        amount > 100 ? interactions.push({ type: 'deposit', interaction: 'Deposit 100' }) : null;
        amount > 1000 ? interactions.push({ type: 'deposit', interaction: 'Deposit 1000' }) : null;
        amount > 1 ? interactions.push({ type: 'deposit', interaction: 'Deposit All' }) : null;
        interactions.push({ type: 'examine', interaction: 'Examine' }) 
    }

    if (event.button == 2) {
        InteractionsPopup.create(event, {
            type: itemId,
            uuid: key
        }, interactions);
        InteractionsPopup.setOpacity(0.85);
    } else {
        if (interactions.length == 0) return;
        Communication.interact(key, interactions[0], UseArray);
        if (interactions[0].type == "on") {
            clearUseArray();
        }
    }
}
container.handleInventoryChange = function (object, state, highlight) {
    if (object.userData.uuid != getCharacterId()) return;
    for (var key in state) {
        if (!key.startsWith('i')) continue;
        object.userData.state[key] = state[key];
    }
    for (var i = 0; i < 24; i++) {
        var key = 'i' + i;
        if (state[key] !== undefined) {
            if (state[key] == '' || inventory[i]) {
                if (inventory[i]) container.remove(inventory[i]);
                inventory[i] = null
            }
            if (state[key] != '') {
                var itemId = state[key][0];
                var quantity = state[key][1];
                var thumbnail = new Panel()
                    .setWidth('50px')
                    .setHeight('50px')
                    .setAttribute('draggable', true)
                    .setLeft((i % 8) * 50 + 'px')
                    .setTop(Math.floor(i / 8) * 50 + 'px')
                    .setPosition('absolute');
                thumbnail.itemId = state[key];

                var image = Thumbnail.generate(itemId, quantity, highlight)
                    .setWidth('50px')
                    .setHeight('50px')
                    .setPosition('absolute')
                    .setCursor('pointer');

                thumbnail.add(image);

                if (quantity > 1) {
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
                }

                ((thumbnail, key, itemId) => {
                    thumbnail.onMouseUp((event) => handleClick(event, key, itemId));
                    touchRightClick(thumbnail, (event) => { handleClick(event, key, itemId) })
-                   thumbnail.onDragEnd(() => onDragEnd(thumbnail));
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
                })(thumbnail, key, itemId);
                container.add(thumbnail);
                inventory[i] = thumbnail;
            }
        }
    }
}

container.onDragOver(x => x.preventDefault());

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);

function getBaseLevel(user, skill) {
    return user.userData.state[Config.skillToFieldMap[skill][1]];
}
function getCurrentLevel(user, skill) {
    return user.userData.state[Config.skillToFieldMap[skill][2]];
}

var prayerThumbnails = [];

Signals.subscribe('assetsLoaded', function () {
    for (var i = Config.prayerList.length - 1; i >= 0; i--) {
        var prayer = Config.prayerList[i];
        
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft(400 + (i % 4) * 50 + 'px')
            .setTop(Math.floor(i / 4) * 50 + 'px')
            .setPosition('absolute')
            .setCursor('pointer');
        var thumbnailImageDiv = new Panel()
            .setWidth('100%');
        thumbnail.add(thumbnailImageDiv);
        var highlightedThumbnail = svgToImageWithHighlight(SVG[prayer.thumbnail + '.svg'])
            .setWidth('42px')
            .setHeight('42px')
            .setPosition('absolute')
            .setTop('4px')
            .setLeft('4px')
            .setOpacity(0.9);
        var regularThumbnail = svgToImage(SVG[prayer.thumbnail + '.svg'])
            .setWidth('42px')
            .setHeight('42px')
            .setPosition('absolute')
            .setTop('4px')
            .setLeft('4px');

        ((prayer) => {
            regularThumbnail.onClick(function () {
                // check fidelity level
                if (getBaseLevel(getCharacter(), 'fidelity') >= prayer.level && getCurrentLevel(getCharacter(), 'fidelity') > 0) {
                    Communication.interact(prayer.id, { type: 'toggle_prayer', interaction: 1 });
                }
            });
            highlightedThumbnail.onClick(function () {
                Communication.interact(prayer.id, { type: 'toggle_prayer', interaction: 0 });
            })
        })(prayer)

        
        prayerThumbnails.unshift({
            highlightedThumbnail: highlightedThumbnail,
            regularThumbnail: regularThumbnail
        })
        
        thumbnailImageDiv.add(highlightedThumbnail);
        thumbnailImageDiv.add(regularThumbnail);

        var infoPopup = new Panel()
            .setPosition('absolute')
            .setDisplay('none')
            .setOpacity(0.85)
            .setBorder('1px solid black')
            .setPadding('5px')
            .setBorderRadius('3px')
            .setBackgroundColor('#ffffff')
            .setLeft('50px')
        var prayerName = new Text()
            .setTextContent(prayer.name)
            .setDisplay('block');
        infoPopup.add(prayerName);
        var levelText = new Text()
            .setTextContent('Level: ' + prayer.level)
            .setDisplay('block')
            .setWhiteSpace('nowrap');
        infoPopup.add(levelText);
        var descriptionText = new Text()
            .setTextContent(prayer.description)
            .setDisplay('block')
            .setWhiteSpace('nowrap');
        infoPopup.add(descriptionText);
        thumbnail.add(infoPopup);

        ((infoPopup, thumbnailImageDiv) => {
            var timer;
            thumbnailImageDiv.onMouseEnter(function () {
                timer = setTimeout(() => {
                    infoPopup.setDisplay('block')
                }, 1000)
            })
            thumbnailImageDiv.onMouseLeave(function (event) {
                infoPopup.setDisplay('none');
                clearTimeout(timer);
            })
        })(infoPopup, thumbnailImageDiv);

        container.add(thumbnail);
    }
});

container.handleFidelityChange = function (object, state) {
    if (object.userData.uuid != getCharacterId()) return;

    if (state.fid !== undefined || state[Config.skillToFieldMap['fidelity'][2]]) {
        var fidelity = state.fid !== undefined ? state.fid : object.userData.state.fid;
        var newCurrentFidelityLevel = state[Config.skillToFieldMap['fidelity'][2]] !== undefined ?
            state[Config.skillToFieldMap['fidelity'][2]] :
            object.userData.state[Config.skillToFieldMap['fidelity'][2]];
        // loop through all prayers
        for (var i = 0; i < Config.prayerList.length; i++) {
            var prayer = Config.prayerList[i];
            var prayerThumbnail = prayerThumbnails[i]

            var isActive = fidelity & Math.pow(2, prayer.id);
            
            if (isActive) {
                prayerThumbnail.highlightedThumbnail.setDisplay('block');
                prayerThumbnail.regularThumbnail.setDisplay('none');
            } else {
                prayerThumbnail.highlightedThumbnail.setDisplay('none');
                prayerThumbnail.regularThumbnail.setDisplay('block');
                prayerThumbnail.regularThumbnail.setCursor('pointer');
                prayerThumbnail.regularThumbnail.setFilter('');
                prayerThumbnail.regularThumbnail.setOpacity(0.9);
            }
            if (getBaseLevel(object, 'fidelity') < prayer.level || newCurrentFidelityLevel == 0) {
                prayerThumbnail.regularThumbnail.setFilter('grayscale(100%)');
                prayerThumbnail.regularThumbnail.setOpacity(0.5);
                prayerThumbnail.regularThumbnail.setCursor('auto');
            }
        }
        // add them to UI based on state
        if (state.fid !== undefined) {
            object.userData.state.fid = state.fid;
        }
    }
}