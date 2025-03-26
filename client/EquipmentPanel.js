import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { addToolTip, svgToImage } from './Utils.js';
import { Config, getCharacterId, SVG } from './Loader.js';
import * as Thumbnail from './Thumbnail.js';
import * as Communication from './Communication.js';

const container = new Panel()
export default container;
container.setClass('EquipmentPanel');

container.setWidth('350px')
    .setHeight('350px')
    .setPosition('absolute')
    .setBorderRadius('5px')
container.show = function () {
    Signals.publish('optionalDialogueShow')
    container.onResize();
    container.setDisplay('block');
}
container.hide = function () {
    container.setDisplay('none');
}
container.hide();
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 350) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 125) / 2;
    container.setBottom(bottom + 'px');
}

var headerPanel = new Panel()
    .setWidth('348px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var titlePanel = new Panel()
    .setHeight('18px')
    .setWidth('330px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextAlign('center')
titlePanel.setTextContent('Equipment Info');
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

var scrollPanel = new Panel()
    .setWidth('348px')
    .setHeight('250px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc')
container.add(scrollPanel);
var mainPanel = new Panel()
    .setWidth('325px')
    .setPadding('10px');
scrollPanel.add(mainPanel);

Signals.subscribe('assetsLoaded', function () {

    var helmetContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('250px')
        .setTop('25px')
    mainPanel.add(helmetContainer);
    helmetContainer.onClick(() => { Communication.interact('ihe', { type: 'remove', interaction: 'Remove' }) });

    var gloveContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setTop('75px')
        .setLeft('200px')
    mainPanel.add(gloveContainer);
    gloveContainer.onClick(() => { Communication.interact('ihan', { type: 'remove', interaction: 'Remove' }) });

    var necklaceContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('250px')
        .setTop('75px')
    mainPanel.add(necklaceContainer);
    necklaceContainer.onClick(() => { Communication.interact('in', { type: 'remove', interaction: 'Remove' }) });

    var arrowContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('300px')
        .setTop('75px')
    var arrowImage = new svgToImage(SVG['arrows_slot.svg'])
        .setWidth('40px')
        .setHeight('40px')
    arrowContainer.add(arrowImage)
    mainPanel.add(arrowContainer);

    var weaponContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setTop('125px')
        .setLeft('200px')
    mainPanel.add(weaponContainer);
    weaponContainer.onClick(() => { Communication.interact('iw', { type: 'remove', interaction: 'Remove' }) });

    var chestContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('250px')
        .setTop('125px')
    mainPanel.add(chestContainer);
    chestContainer.onClick(() => { Communication.interact('ib', { type: 'remove', interaction: 'Remove' }) });

    var shieldContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('300px')
        .setTop('125px')
    mainPanel.add(shieldContainer);
    shieldContainer.onClick(() => { Communication.interact('ish', { type: 'remove', interaction: 'Remove' }) });

    var legContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('250px')
        .setTop('175px')
    mainPanel.add(legContainer);
    legContainer.onClick(() => { Communication.interact('il', { type: 'remove', interaction: 'Remove' }) });

    var bootContainer = new Panel()
        .setWidth('40px')
        .setHeight('40px')
        .setBorderRadius('5px')
        .setBorder('1px solid')
        .setPosition('absolute')
        .setLeft('250px')
        .setTop('225px')
    mainPanel.add(bootContainer);
    bootContainer.onClick(() => { Communication.interact('if', { type: 'remove', interaction: 'Remove' }) });

    function addContainer(top, text) {
        var accuracyContainer = new Panel()
            .setHeight('20px')
            .setPosition('absolute')
            .setLeft('5px')
            .setTop(top)
        var accuracyText = new Panel()
            .setTextContent(text)
            .setFontSize('14px')
            .setWidth('90px')
            .setTextAlign('right')
            .setDisplay('inline-block')
        accuracyContainer.add(accuracyText);
        var accuracyBonus = new Text()
            .setTextContent('23.1 (+150)')
            .setFontSize('12px')
            .setFontWeight('bold')
            .setDisplay('inline-block')
            .setMarginLeft('5px')
        accuracyContainer.add(accuracyBonus);
        mainPanel.add(accuracyContainer)
        return accuracyBonus;
    }

    var accuracyBonus = addContainer('35px', 'Accuracy: ');
    var maxHitBonus = addContainer('55px', 'Max hit: ');
    var defenseBonus = addContainer('75px', 'Defense: ');
    var slashDef = addContainer('95px', 'Slash def: ');
    var stabDef = addContainer('115px', 'Stab def: ');
    var crushDef = addContainer('135px', 'Crush def: ');
    var archeryDef = addContainer('155px', 'Archery def: ');

    var cachedItemId = {};
    
    function addImage(target, itemId, name) {
        if (itemId == cachedItemId[name]) return;
        cachedItemId[name] = itemId;
        if (itemId) {
            // generate thumbnail and add
            var image = Thumbnail.generate(itemId, 5, false)
                .setWidth('40px')
                .setHeight('40px')
                .setPosition('absolute')
                .setCursor('pointer');
            target.clear();
            target.add(image);
            addToolTip(target, Config.definitions[itemId].itemName)
        } else {
            var image = new svgToImage(SVG[name])
                .setWidth('40px')
                .setHeight('40px')
            target.clear();
            target.add(image)
        }
    }

    container.handleChange = function(object, state) {
        if (object.userData.uuid != getCharacterId()) return;
        if (state.ihe !== undefined) {
            object.userData.state.ihe = state.ihe;
            var itemId = state.ihe;
            addImage(helmetContainer, itemId, 'helmet_slot.svg')
        }
        if (state.in !== undefined) {
            object.userData.state.in = state.in;
            var itemId = state.in;
            addImage(necklaceContainer, itemId, 'necklace_slot.svg')
        }
        if (state.ib !== undefined) {
            object.userData.state.ib = state.ib;
            var itemId = state.ib;
            addImage(chestContainer, itemId, 'chest_slot.svg')
        }
        if (state.il !== undefined) {
            object.userData.state.il = state.il;
            var itemId = state.il;
            addImage(legContainer, itemId, 'leg_slot.svg')
        }
        if (state.if !== undefined) {
            object.userData.state.if = state.if;
            var itemId = state.if;
            addImage(bootContainer, itemId, 'boot_slot.svg')
        }
        if (state.ihan !== undefined) {
            object.userData.state.ihan = state.ihan;
            var itemId = state.ihan;
            addImage(gloveContainer, itemId, 'glove_slot.svg')

        }
        if (state.ish !== undefined) {
            object.userData.state.ish = state.ish;
            var itemId = state.ish;
            addImage(shieldContainer, itemId, 'shield_slot.svg')
        }
        if (state.iw !== undefined) {
            object.userData.state.iw = state.iw;
            var itemId = state.iw;
            addImage(weaponContainer, itemId, 'weapon_slot.svg')
        }
        var accuracy = 0;
        var strength = 0;
        var defense = 0;
        var crushDefense = 0;
        var slashDefense = 0;
        var stabDefense = 0;
        var archeryDefense = 0;
        var args = ['ihe', 'in', 'ib', 'il', 'if', 'ihan', 'ish', 'iw'];
        for (var arg of args) {
            var itemId = object.userData.state[arg]
            if (Config.definitions[itemId]) {
                var wearBehavior = Config.definitions[itemId].wearBehavior;
                accuracy += wearBehavior.accuracy ? wearBehavior.accuracy : 0;
                strength += wearBehavior.strength ? wearBehavior.strength : 0;
                defense += wearBehavior.defense ? wearBehavior.defense : 0;
                crushDefense += wearBehavior.crushDefense ? wearBehavior.crushDefense : 0;
                slashDefense += wearBehavior.slashDefense ? wearBehavior.slashDefense : 0;
                stabDefense += wearBehavior.stabDefense ? wearBehavior.stabDefense : 0;
                archeryDefense += wearBehavior.archeryDefense ? wearBehavior.archeryDefense : 0;
            }
        }
        // calculate effective levels based on current levels and bonuses
        // maybe include attackParameters locally too
        var accuracyLevel = object.userData.state.kac;
        var strengthLevel = object.userData.state.ksc;
        var defenseLevel = object.userData.state.kdc;
        var archeryLevel = object.userData.state.karc;

        //0, 25, 45, 65, 85

        function getBonus(bonus, level) {
            
            // go up 18 points per 5 levels starting at -5 bonus, increase for 20 levels by total of 10

            var newBonus = (((bonus / (18/5) - level - 5) + 20) / 2) * 10;
            if (newBonus < 0) {
                newBonus *= 2;
            }
            return newBonus
        }

        if (object.userData.state.iw && object.userData.state.iw.includes('bow')) {
            accuracyLevel = archeryLevel;
            strengthLevel = archeryLevel;

            // get first arrow
            var itemId = '';
            var ammoString = '_arrows';
            if (object.userData.state.iw.includes('crossbow')) {
                ammoString = '_bolts';
            }

            for (var i = 0; i < 24; i++) {
                if (object.userData.state['i' + i][0] && object.userData.state['i' + i][0].includes(ammoString)) {
                    itemId = object.userData.state['i' + i][0];
                    break;
                }
            }
            // only clear if update
            addImage(arrowContainer, itemId, 'arrows_slot.svg')

            // add in arrow bonus
            var arrowMaterial = itemId.split('_')[0];
            var arrowLevel = Config.materialToLevelMap[arrowMaterial] ? Config.materialToLevelMap[arrowMaterial] : 0;
            accuracy += arrowLevel;
            strength += arrowLevel;

        } else {
            // only clear if updates
            addImage(arrowContainer, '', 'arrows_slot.svg')
        }

        var adjustedAccuracy = getBonus(accuracy, accuracyLevel);
        var adjustedStrength = getBonus(strength, strengthLevel);
        var adjustedDefense = getBonus(defense, defenseLevel);
        var adjustedCrushDefense = getBonus(defense + crushDefense, defenseLevel);
        var adjustedSlashDefense = getBonus(defense + slashDefense, defenseLevel);
        var adjustedStabDefense = getBonus(defense + stabDefense, defenseLevel);
        var adjustedArcheryDefense = getBonus(defense + archeryDefense, defenseLevel);

        var effectiveAccuracyLevel = accuracyLevel + adjustedAccuracy / 10;
        var effectiveDefenseLevel = defenseLevel + adjustedDefense / 10;
        var maxHit = Math.floor((strengthLevel + adjustedStrength / 10) / 4);
        var effectiveCrushDefenseLevel = defenseLevel + adjustedCrushDefense / 10;
        var effectiveSlashDefenseLevel = defenseLevel + adjustedSlashDefense / 10;
        var effectiveStabDefenseLevel = defenseLevel + adjustedStabDefense / 10;
        var effectiveArcheryDefenseLevel = defenseLevel + adjustedArcheryDefense / 10;

        accuracyBonus.setTextContent(Math.floor(effectiveAccuracyLevel) + ' (+' + accuracy + ')');
        maxHitBonus.setTextContent(Math.floor(maxHit) + ' (+' + strength + ')');
        defenseBonus.setTextContent(Math.floor(effectiveDefenseLevel) + ' (+' + defense + ')');
        slashDef.setTextContent(Math.floor(effectiveSlashDefenseLevel) + ' (+' + (defense + slashDefense) + ')');
        stabDef.setTextContent(Math.floor(effectiveStabDefenseLevel) + ' (+' + (defense + stabDefense) + ')');
        crushDef.setTextContent(Math.floor(effectiveCrushDefenseLevel) + ' (+' + (defense + crushDefense) + ')');
        archeryDef.setTextContent(Math.floor(effectiveArcheryDefenseLevel) + ' (+' + (defense + archeryDefense) + ')');

    }

})

Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});
Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('optionalDialogueShow', function () {
    container.hide();
})