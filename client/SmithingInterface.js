import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { getCharacter, getCharacterId } from './Loader.js';
import * as Thumbnail from './Thumbnail.js';
import { formatItemQuantity, touchRightClick } from './Utils.js';
import InteractionsPopup from './InteractionsPopup.js';
import * as Communication from './Communication.js';

const container = new Panel()
export default container;
container.setClass('Smith');

container.setWidth('400px')
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
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 400) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 220) / 2;
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

var panels = {}
for (var r = 0; r < 4; r++) {
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
        if (r == 3) panel.setBorderBottom('0px solid').setHeight('49px')
        panel.onDragOver(x => x.preventDefault());
        container.add(panel);
        panels[r * 8 + c] = panel;
    }
}


var options = [
    ['nails', 1],
    ['arrowheads', 1],
    ['bolts', 2],
    ['hammer_head', 2],
    ['spear_head', 2],
    ['knife', 3],
    ['hatchet_head', 3],
    ['pickaxe_head', 4],
    ['scythe_head', 4],
    ['mace_head', 6],
    ['sword', 8],
    ['saber', 8],

    ['med_helmet', 8],
    ['full_helmet', 8],
    ['plate_legs', 12],
    ['chain_body', 12],
    ['square_shield', 16],
    ['round_shield', 16],
    ['kite_shield', 16],
    ['plate_body', 16],

    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
];


function handleClick(event, itemId, itemPostfix) {
    var interactions = [
        { type: 'smith', interaction: 'Make' },
    ];

    if (event.button == 2) {
        InteractionsPopup.create(event, {
            type: itemId,
            uuid: itemPostfix
        }, interactions);
        InteractionsPopup.setOpacity(0.85);
    } else {
        Communication.interact(itemPostfix, interactions[0]);
    }
}

var thumbnails = {};
function updateInterface(target) {
    if (!target) return;
    var material = target.split(',')[1].split('_')[0];
    var quantityOfMaterial = 0;
    for (var i = 0; i < 24; i++) {
        quantityOfMaterial += getCharacter().userData.state['i' + i][0] == material + '_ingot_huge' ? 4 : 0;
        quantityOfMaterial += getCharacter().userData.state['i' + i][0] == material + '_ingot_large' ? 3 : 0;
        quantityOfMaterial += getCharacter().userData.state['i' + i][0] == material + '_ingot_medium' ? 2 : 0;
        quantityOfMaterial += getCharacter().userData.state['i' + i][0] == material + '_ingot_small' ? 1 : 0;
    }

    titlePanel.setTextContent(material.charAt(0).toUpperCase() + material.slice(1) + ' Smithing');
    for (var i = 0; i < 32; i++) {
        var option = options[i];
        panels[i].setBackgroundColor('white');
        if (!option.length) {
            panels[i].setBackgroundColor('#dddddd')
            continue;
        };
        if (thumbnails[i]) {
            if (thumbnails[i]) container.remove(thumbnails[i]);
            thumbnails[i] = null
        }
        var itemId = material + '_' + option[0];
        var quantity = option[1];
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft((i % 8) * 50 + 'px')
            .setTop(20 + Math.floor(i / 8) * 50 + 'px')
            .setPosition('absolute');
        var image = Thumbnail.generate(itemId, 5)
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
        thumbnails[i] = thumbnail;

        if (quantity > quantityOfMaterial) {
            image.dom.style.filter = 'grayscale(100%)'
        } else {
            ((itemId, itemPostfix) => {
                thumbnail.onMouseUp((event) => handleClick(event, itemId, itemPostfix));
                touchRightClick(thumbnail, (event) => handleClick(event, itemId, itemPostfix))
            })(itemId, option[0]);
        }
    }
}

function handleChange(object, actualState) {

    if (object.userData.uuid != getCharacterId()) return;
    if (actualState.msis === undefined && actualState.msit === undefined) return;

    var showInterface = actualState.msis !== undefined ? actualState.msis : object.userData.state.msis;
    var interfaceTarget = actualState.msit !== undefined ? actualState.msit : object.userData.state.msit;

    if (object.userData.state.msis !== undefined) {
        updateInterface(interfaceTarget);
        if (actualState.msis == 0) {
            container.hide();
        } else {
            container.show();
        }
        container.onResize();
    }

    object.userData.state.msis = showInterface;
    object.userData.state.msit = interfaceTarget;
}
container.handleChange = handleChange;

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('viewportClick', container.hide);
Signals.subscribe('disconnect', container.hide);
Signals.subscribe('characterMove', container.hide);