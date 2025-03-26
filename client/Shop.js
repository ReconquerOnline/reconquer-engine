import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { getCharacter, getCharacterId } from './Loader.js';
import { getObjectByUUID, touchRightClick } from './Utils.js';
import { MainScene } from './Editor.js';
import * as Thumbnail from './Thumbnail.js';
import { formatItemQuantity } from './Utils.js';
import InteractionsPopup from './InteractionsPopup.js';
import * as Communication from './Communication.js';
import { Config } from './Loader.js';

const container = new Panel()
export default container;
container.setClass('Shop');

container.setWidth('200px')
    .setHeight('220px')
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
var latestTarget = null;
container.getInventoryInteractions = function (amount) {
    if (titlePanel.getTextContent() == 'Resource Chest') {
        return false;
    } else if(latestTarget && latestTarget.userData.state.free) {
        var interactions = [
            { type: 'sell', interaction: 'Deposit' },
            { type: 'sell', interaction: 'Deposit All' },
            { type: 'examine', interaction: 'Examine' }
        ];
        return interactions;
    } else {
        var interactions = [
            { type: 'value', interaction: 'Value' },
            { type: 'sell', interaction: 'Sell' }
        ];
        amount > 1 ? interactions.push({ type: 'sell', interaction: 'Sell 10' }) : null;
        amount > 10 ? interactions.push({ type: 'sell', interaction: 'Sell 100' }) : null;
        interactions.push({ type: 'examine', interaction: 'Examine' })
        return interactions;
    }

}

container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 200) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 220) / 2;
    container.setBottom(bottom + 'px');
}
container.hide();


var headerPanel = new Panel()
    .setWidth('198px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var titlePanel = new Panel()
    .setHeight('18px')
    .setWidth('180px')
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

var panels = {}
for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
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
        if (c == 3) panel.setBorderRight('0px solid').setWidth('49px')
        if (r == 3) panel.setBorderBottom('0px solid').setHeight('49px')
        panel.onDragOver(x => x.preventDefault());
        container.add(panel);
        panels[r * 4 + c] = panel;
    }
}

function handleClick(event, slot, itemId, target) {
    var interactions = [
        { type: 'price', interaction: 'Price' },
        { type: 'buy', interaction: 'Buy' },
    ];

    interactions.push({ type: 'buy', interaction: 'Buy 10' });
    if (Config.definitions[itemId].stackable) {
        interactions.push({ type: 'buy', interaction: 'Buy 100' });
    }

    if (target.userData.state.dn == 'Resource Chest') {
        interactions = [
            { type: 'withdraw_resource', interaction: 'Withdraw' },
            { type: 'withdraw_resource', interaction: 'Withdraw All' }
        ];
    } else if (target.userData.state.free) {
        interactions = [
            { type: 'buy', interaction: 'Withdraw' },
            { type: 'buy', interaction: 'Withdraw All' }
        ];
    }


    interactions.push({ type: 'examine', interaction: 'Examine' });

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

var thumbnails = {};
function updateShop(shopTarget) {
    var target = getObjectByUUID(MainScene, shopTarget);
    if (!target) return;
    latestTarget = target;
    titlePanel.setTextContent(target.userData.state.dn + ' Shop');
    if (target.userData.state.free) {
        titlePanel.setTextContent(target.userData.state.dn);
    }
    for (var i = 0; i < 16; i++) {
        var slot = 'mi' + i;
        panels[i].setBackgroundColor('white')
        if (thumbnails[i]) {
            if (thumbnails[i]) container.remove(thumbnails[i]);
            thumbnails[i] = null
        }
        if (!target.userData.state[slot]) {
            panels[i].setBackgroundColor('#dddddd')
            continue;
        };
        var itemId = target.userData.state[slot][0];
        var quantity = target.userData.state[slot][1];
        if (!itemId) continue;
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft((i % 4) * 50 + 'px')
            .setTop(20 + Math.floor(i / 4) * 50 + 'px')
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
        ((slot, itemId, target) => {
            thumbnail.onMouseUp((event) => handleClick(event, slot, itemId, target));
            touchRightClick(thumbnail, (event) => handleClick(event, slot, itemId, target));
        })(slot, itemId, target);
        thumbnails[i] = thumbnail;
    }
}

function handleShopChange(object, actualState) {
    var update = false;
    for (var i = 0; i < 16; i++) {
        var slot = 'mi' + i;
        if (!actualState[slot]) continue;
        object.userData.state[slot] = actualState[slot];
        update = true;
    }

    if (actualState.free) {
        object.userData.state.free = actualState.free;
    }

    var character = getCharacter();
    if (update && character && character.userData.state.mst == object.userData.uuid) {
        updateShop(object.userData.uuid);
    }

    if (object.userData.uuid != getCharacterId()) return;
    if (actualState.mss === undefined && actualState.mst === undefined) return;

    var newShowShop = actualState.mss !== undefined ? actualState.mss : object.userData.state.mss;
    var newShopTarget = actualState.mst !== undefined ? actualState.mst : object.userData.state.mst;

    if (object.userData.state.mss !== undefined) {
        updateShop(newShopTarget);
        container.show();
        container.onResize();
    }

    object.userData.state.mss = newShowShop;
    object.userData.state.mst = newShopTarget;
}
container.handleShopChange = handleShopChange;

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('viewportClick', container.hide);
Signals.subscribe('disconnect', container.hide);
Signals.subscribe('characterMove', container.hide);
