import { Panel, Text, Button, Datalist } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { Config, getCharacter } from './Loader.js';
import * as Communication from './Communication.js';
import * as Loader from './Loader.js';

const container = new Panel()
export default container;
container.setClass('CharacterEditor');

container.setWidth('400px')
    .setHeight('320px')
    .setPosition('absolute')
    .setBorderRadius('5px')
container.show = function () {
    container.setDisplay('block');
}
container.hide = function () {
    container.setDisplay('none');
    Signals.publish('CloseCharacterEditor');
}
container.hide();
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width / 2 - 400) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var top = (height - 400) / 2;
    container.setTop(top + 'px');
}

container.isVisible = function () {
    return container.dom.style.display != 'none';
}

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
titlePanel.setTextContent('Character Options');
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

var mainPanel = new Panel()
    .setWidth('398px')
    .setHeight('340px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(mainPanel)



var typeColumn = new Panel()
    .setWidth('50%')
    .setLeft('0px')
    .setPosition('absolute')
    .setTop('28px');
mainPanel.add(typeColumn);
typeColumn.add(
    new Text()
        .setTextContent('Type')
        .setWidth('100%')
        .setDisplay('block')
        .setTextAlign('center')
        .setHeight('35px')
        .setFontWeight('600')
);


var colorColumn = new Panel()
    .setWidth('50%')
    .setRight('0px')
    .setPosition('absolute')
    .setTop('28px');
mainPanel.add(colorColumn);
colorColumn.add(
    new Text()
        .setTextContent('Color')
        .setWidth('100%')
        .setDisplay('block')
        .setTextAlign('center')
        .setHeight('35px')
        .setFontWeight('600')
);

function addOption(option, column) {
    var panel = new Panel()
        .setHeight('40px');
    column.add(panel);

    var leftButton = new Button()
        .setTextContent('<')
        .setLeft('15px')
        .setPosition('absolute')
        .setWidth('30px')
        .setHeight('30px')
        .setBorderRadius('5px');
    leftButton.onClick(() => {
        Communication.interact(option.id, {
            type: 'character_configure',
            interaction: 0
        });
    });
    var name = new Text()
        .setTextContent(option.name)
        .setTextAlign('center')
        .setWidth('100%')
        .setDisplay('inline-block')
        .setTop('5px')
        .setPosition('relative')
    var rightButton = new Button()
        .setTextContent('>')
        .setRight('15px')
        .setPosition('absolute')
        .setWidth('30px')
        .setHeight('30px')
        .setBorderRadius('5px')
    rightButton.onClick(() => {
        Communication.interact(option.id, {
            type: 'character_configure',
            interaction: 1
        });
    });
    panel.add(name);
    panel.add(leftButton);
    panel.add(rightButton);
}
var beginRendering = false;
Signals.subscribe('assetsLoaded', () => {
    for (var option of Config.characterTypeOptions) {
        addOption(option, typeColumn);
    }
    for (var option of Config.characterColorOptions) {
        addOption(option, colorColumn);
    }

    var manButton = new Button(true)
        .setInnerHTML('&#9794;')
        .setPosition('absolute')
        .setLeft('255px')
        .setTop('230px')
        .setWidth('50px')
        .setHeight('50px')
        .setFontSize('25px')
    
    var womanButton = new Button(true)
        .setInnerHTML('&#9792;')
        .setPosition('absolute')
        .setLeft('305px')
        .setTop('230px')
        .setWidth('50px')
        .setHeight('50px')
        .setFontSize('25px')
    mainPanel.add(manButton);
    mainPanel.add(womanButton);

    manButton.onClick(() => {
        Communication.interact('gender', {
            type: 'character_configure',
            interaction: 0
        })
    })
    womanButton.onClick(() => {
        Communication.interact('gender', {
            type: 'character_configure',
            interaction: 1
        })
    })
    manButton.onToggle(() => {
        womanButton.setToggle(false);
    })
    manButton.offToggle(() => {
        if(!womanButton.getToggle()) return manButton.setToggle(true);
    })
    womanButton.onToggle(() => {
        manButton.setToggle(false);
    })
    womanButton.offToggle(() => {
        if(!manButton.getToggle()) return womanButton.setToggle(true);
    })

    var userNameText = new Text()
        .setTextContent('Name: ')
        .setWidth('100px')
        .setDisplay('block')
        .setTextAlign('right')
        .setHeight('35px')
        .setFontWeight('600')
        .setTop('230px')
        .setPosition('absolute')
        .setFontSize('15px')
    mainPanel.add(userNameText);
    var namesList = new Datalist(Config.names)
        .setWidth('90px')
        .setPosition('absolute')
        .setLeft('110px')
        .setTop('230px');
    mainPanel.add(namesList);
    var descriptorText = new Text()
        .setTextContent('Descriptor: ')
        .setWidth('100px')
        .setDisplay('block')
        .setTextAlign('right')
        .setHeight('35px')
        .setFontWeight('600')
        .setTop('260px')
        .setPosition('absolute')
        .setFontSize('15px')
    mainPanel.add(descriptorText);
    var adjectivesList = new Datalist(Config.adjectives)
        .setWidth('90px')
        .setPosition('absolute')
        .setLeft('110px')
        .setTop('260px');
    namesList.onKeyDown(event => {
        event.stopPropagation();
    })
    namesList.onInput((event) => {
        var value = namesList.getValue();
        var index = Config.names.indexOf(value);
        if (index == -1) return;
        Communication.interact('name', {
            type: 'change_name',
            interaction: index
        })
    });
    adjectivesList.onKeyDown(event => {
        event.stopPropagation();
    })
    adjectivesList.onInput((event) => {
        var value = adjectivesList.getValue();
        var index = Config.adjectives.indexOf(value);
        if (index == -1) return;
        Communication.interact('descriptor', {
            type: 'change_name',
            interaction: index
        })
    });
    mainPanel.add(adjectivesList);
    var nameText = new Text()
        .setTextContent('Full Name: ')
        .setWidth('100px')
        .setDisplay('block')
        .setTextAlign('right')
        .setHeight('35px')
        .setFontWeight('600')
        .setTop('290px')
        .setPosition('absolute')
        .setFontSize('15px')
    mainPanel.add(nameText);
    var finalName = new Text()
        .setWidth('290px')
        .setPosition('absolute')
        .setLeft('110px')
        .setTop('290px');
    mainPanel.add(finalName);

    var confirmButton = new Button()
        .setTextContent('Confirm')
        .setLeft('15px')
        .setPosition('absolute')
        .setWidth('370px')
        .setHeight('30px')
        .setBorderRadius('5px')
        .setTop('320px')
        .setBackgroundColor('#2ecc71aa')
    mainPanel.add(confirmButton);
    confirmButton.onClick(container.hide);


    container.handleChange = function (object, actualState) {
        if (object.userData.uuid == Loader.getCharacterId() && actualState.dn) {
            finalName.setTextContent(actualState.dn)
            var name = actualState.dn.split(' ')[0];
            var descriptor = actualState.dn.split(' ')[2];
            if (!descriptor) {
                descriptor = '';
            }
            namesList.setValue(name);
            adjectivesList.setValue(descriptor);
           
            // store displayname to uuid for login screen
            localStorage.setItem('dn_' + object.userData.uuid, actualState.dn)
        }
        // check if man or woman...
        if (object.userData.uuid == Loader.getCharacterId() && actualState.w !== undefined) {
            if (actualState.w) {
                womanButton.setToggle(true)
                manButton.setToggle(false)
            } else {
                womanButton.setToggle(false)
                manButton.setToggle(true)
            }
            object.userData.state.w = actualState.w;
        }
        if (object.userData.uuid == Loader.getCharacterId() && (actualState.lx || actualState.ly)) {
            container.hide();
        }

        if (actualState.zedit) {
            object.userData.state.zedit = actualState.zedit;
            if (beginRendering) {
                container.show();
                container.onResize();
            }
        }
    }
});
Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', () => {
    var char = getCharacter();
    beginRendering = true;
    if (char.userData.state.zedit) {
        setTimeout(() => {
            container.show();
            container.onResize();
        }, 0);
    }
    
});
Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});