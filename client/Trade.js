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

const container = new Panel()
export default container;
container.setClass('Trade');

container.setWidth('400px')
    .setHeight('120px')
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
    var bottom = (height - 120) / 2;
    container.setBottom(bottom + 'px');
}
container.hide();

function cancelTrade() {
    var characterData = getCharacter().userData.state;
    Communication.move(characterData.lsx, characterData.lsy, characterData.lx, characterData.ly);
    container.hide();
}

function createAcceptIcon() {
    return new Panel()
        .setTextContent('✔')
        .setPosition('absolute')
        .setBackgroundColor('#2ecc71')
        .setBorderRadius('3px')
        .setWidth('14px')
        .setHeight('14px')
        .setTextAlign('center')
        .setFontSize('12px')
        .setColor('white')
        .setTop('3px')
        .setDisplay('none');
}

var headerPanel = new Panel()
    .setWidth('398px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var userTitlePanel = new Panel()
    .setHeight('20px')
    .setWidth('198px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextAlign('center')
    .setBorderRight('3px solid #cccccc');
headerPanel.add(userTitlePanel);
var userAcceptIcon = createAcceptIcon()
    .setLeft('3px');
headerPanel.add(userAcceptIcon);
var userFinalizeIcon = createAcceptIcon()
    .setLeft('20px');
headerPanel.add(userFinalizeIcon);

var partnerTitlePanel = new Panel()
    .setHeight('18px')
    .setWidth('180px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('200px')
    .setTextAlign('center')
headerPanel.add(partnerTitlePanel);
var partnerAcceptIcon = createAcceptIcon()
    .setLeft('203px');
headerPanel.add(partnerAcceptIcon);
var partnerFinalizeIcon = createAcceptIcon()
    .setLeft('220px');
headerPanel.add(partnerFinalizeIcon);

var closePanel = new Panel()
    .setHeight('18px')
    .setWidth('18px')
    .setPosition('absolute')
    .setTop('0px')
    .setRight('0px')
    .setTextContent('\u00d7')
    .setCursor('pointer');
headerPanel.add(closePanel)
closePanel.onClick(cancelTrade);

var panels = {}
for (var r = 0; r < 2; r++) {
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
        if (c == 3) panel.setBorderRight('2px solid #cccccc').setWidth('47px')
        if (c == 7) panel.setBorderRight('0px solid').setWidth('49px')
        if (r == 1) panel.setBorderBottom('0px solid').setHeight('49px')
        container.add(panel);
        panels[r * 4 + c] = panel;
    }
}
var footerPanel = new Panel()
    .setHeight('18px')
    .setWidth('398px')
    .setPosition('absolute')
    .setTop('120px')
    .setLeft('0px');
container.add(footerPanel)

var acceptButton = new Panel()
    .setHeight('18px')
    .setWidth('197px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextContent('Accept')
    .setCursor('pointer')
    .setBackgroundColor('white')
    .setTextAlign('center')
    .setColor('green')
    .setBorder('1px solid #cccccc')
    .setBorderRight('3px solid #cccccc')
    .setOpacity(.7);
footerPanel.add(acceptButton);
function acceptClick() {
    if (acceptButton.disabled) return;
    Communication.interact(
        getCharacter().userData.state.mpt,
        {
            type: 'trade_player',
            interaction: acceptButton.dom.innerText
        }
    );
}

acceptButton.onClick(acceptClick)

var declineButton = new Panel()
    .setHeight('18px')
    .setWidth('200px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('200px')
    .setTextContent('Decline')
    .setCursor('pointer')
    .setBackgroundColor('white')
    .setTextAlign('center')
    .setColor('red')
    .setBorder('1px solid #cccccc')
    .setOpacity(.7);
footerPanel.add(declineButton);
declineButton.onClick(cancelTrade);

function handleClick(event, slot, itemId, offset) {
    var interactions = [];

    if (offset == 0) {
        interactions.push({ type: 'remove_offer', interaction: 'Remove' });
    } else {
        interactions.push({ type: 'examine', interaction: 'Examine' });
    }

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
function updateTrade(targetUuid, offset, title) {
    var target = getObjectByUUID(MainScene, targetUuid);
    if (!target) return;
    title.setTextContent(target.userData.state.dn);
    for (var i = 0; i < 8; i++) {
        var slot = 'ti' + i;
        if (thumbnails[i + offset]) {
            if (thumbnails[i + offset]) container.remove(thumbnails[i + offset]);
            thumbnails[i + offset] = null
        }
        var itemId = target.userData.state[slot][0];
        var quantity = target.userData.state[slot][1];
        if (!itemId) continue;
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft((i % 4) * 50 + offset * 25 + 'px')
            .setTop(20 + Math.floor(i / 4) * 50 + 'px')
            .setPosition('absolute');
        var image = Thumbnail.generate(itemId, quantity)
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

        ((slot, itemId, offset) => {
            thumbnail.onMouseUp((event) => handleClick(event, slot, itemId, offset));
            touchRightClick(thumbnail, (event) => { handleClick(event, slot, itemId, offset) })
        })(slot, itemId, offset);
        container.add(thumbnail);
        thumbnails[i + offset] = thumbnail;
    }
}

function setAcceptIconState(state, acceptIcon, finalizeIcon) {
    if (state == 0) {
        acceptIcon.setDisplay('none');
        finalizeIcon.setDisplay('none');
    } else if (state == 1) {
        acceptIcon.setDisplay('block');
        finalizeIcon.setDisplay('none');
    } else {
        acceptIcon.setDisplay('block');
        finalizeIcon.setDisplay('block');
    }
}

function enableAcceptButton() {
    acceptButton.setCursor('pointer');
    acceptButton.setBackgroundColor('white');
    acceptButton.disabled = false;
}

function disableAcceptButton() {
    acceptButton.setCursor('default');
    acceptButton.setBackgroundColor('#cccccc');
    acceptButton.disabled = true;
}

function setAcceptButton(userState, targetState) {
    if (userState == 0) {
        acceptButton.setTextContent('Accept');
        enableAcceptButton();
    } else if (userState == 1) {
        if (targetState == 0) {
            acceptButton.setCursor('default');
            disableAcceptButton();
        } else {
            enableAcceptButton();
        }
        acceptButton.setTextContent('Finalize');
    } else {
        disableAcceptButton();
        acceptButton.setTextContent('Finalize');
    }
}

function handleTradeChange(object, actualState) {
    var update = false;
    for (var i = 0; i < 16; i++) {
        var slot = 'ti' + i;
        if (!actualState[slot]) continue;
        object.userData.state[slot] = actualState[slot];
        update = true;
    }

    var character = getCharacter();
    if (actualState.mps !== undefined) {
        var newTradeState = actualState.mps;
        if (object.userData.uuid == getCharacterId()) {
            setAcceptIconState(newTradeState, userAcceptIcon, userFinalizeIcon);
        } else if (character && object.userData.uuid == getCharacter().userData.state.mpt) {
            setAcceptIconState(newTradeState, partnerAcceptIcon, partnerFinalizeIcon);
        }
        object.userData.state.mps = newTradeState;
    }
    if (character) {
        var target = getObjectByUUID(MainScene, character.userData.state.mpt)
        if (target && target.userData.state) {
            setAcceptButton(character.userData.state.mps, target.userData.state.mps);
        }
    }
    if (update && character && (
        object.userData.uuid == character.userData.state.mpt ||
        object.userData.uuid == getCharacterId())) {
        updateTrade(getCharacterId(), 0, userTitlePanel);
        updateTrade(character.userData.state.mpt, 8, partnerTitlePanel);
    }

    if (object.userData.uuid != getCharacterId()) return;
    if (actualState.msp === undefined && actualState.mpt === undefined) return;

    var newShowTrade = actualState.msp !== undefined ? actualState.msp : object.userData.state.msp;
    var newTradeTarget = actualState.mpt !== undefined ? actualState.mpt : object.userData.state.mpt;

    if (object.userData.state.msp !== undefined) {
        if (newShowTrade == 0) {
            container.hide();
        } else {
            updateTrade(getCharacterId(), 0, userTitlePanel);
            updateTrade(newTradeTarget, 8, partnerTitlePanel);
            container.show();
            container.onResize();
        }
    }

    object.userData.state.msp = newShowTrade;
    object.userData.state.mpt = newTradeTarget;
}
container.handleTradeChange = handleTradeChange;

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('viewportClick', container.hide);

Signals.subscribe('disconnect', container.hide);