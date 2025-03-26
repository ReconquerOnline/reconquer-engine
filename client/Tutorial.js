import { Panel, Button } from './UI.js';
import * as Signals from './Signals.js';
import Viewport, { displayArrowMesh, hideArrowMesh } from './Viewport.js';
import { Config, getCharacter, getCharacterId } from './Loader.js';
import CharacterEditor from './CharacterEditor.js';
import FlashingArrow from './FlashingArrow.js';
import { getObjectByDisplayName, getObjectByUUID } from './Utils.js';
import { MainScene } from './Editor.js';
import { enableSoundEffects, playMusic } from './Music.js';

var yOffset = 400;

function slidePanel(amount, duration) {
    var oldYOffset = yOffset;

    var intervalId = setInterval(() => {
        yOffset += (amount / duration);
        container.onResize();
        if (Math.abs(yOffset - oldYOffset) > Math.abs(amount)) {
            clearInterval(intervalId);
        }
    }, 10);
}
  

var prompts = [
    {
        text: "Welcome to Reconquer! I'm going to help you get started.",
        initialTest: function (char) { return char.userData.state.q000 == 0 && char.userData.state.zedit == 1 },
        onEnter: function () {
            yOffset = 400;
            container.onResize();
            nextButton.setDisplay('block');
            nextButton.setTextContent('Continue')
            nextButton.setBackgroundColor('#2ecc71aa')
            setTimeout(() => { CharacterEditor.hide() }, 0);
            hideArrowMesh();
            FlashingArrow.hide();
        }
    },
    {
        text: 'You can rotate the camera by clicking and dragging. You can also use the <em>WASD</em> keys.',
        onEnter: function () {
            //displayArrowMesh(-10.5, 10, -10.5);
            //FlashingArrow.show((width, height) => { return [(width - 460) / 2, (height + 460) / 2] });
        }
    },
    {
        text: "You can zoom the camera using the mouse wheel. You can also use the <em>EQ</em> keys."
    },
    {
        text: "Configure your character using this dialogue!",
        onEnter: function () {
            CharacterEditor.show();
            slidePanel(200, 20);
            FlashingArrow.show((width, height) => { return [(width / 2 - 50) / 2, (height - 560) / 2] });
            nextButton.setDisplay('none');
        }
    },
    {
        text: "You can move around the scene by clicking on the environment. You can also use the arrow keys.",
        initialTest: function (char) { return char.userData.state.q000 == 0 },
        onEnter: function () {
            slidePanel(-100, 20);
            FlashingArrow.hide();
            nextButton.setDisplay('block');
        }
    },
    {
        text: "You can interact with objects by clicking on them. If you right click on them, you can see all the possible interactions."
    },
    {
        text: "Click on the bush and see if you can pick a berry.",
        onEnter: function () {
            slidePanel(500, 20);
            displayArrowMesh(-20, 9, 15.5);
        }
    },
    {
        text: "<b>Note:</b> Sometimes monsters or other characters will get in your way. You can push through other players through the right-click menu.",
        onEnter: function () {
            hideArrowMesh();
        }
    },
    {
        text: "<b>Advanced Note:</b> You can also queue up actions. Right click on the option and your player will perform that action once it becomes idle."
    },
    {
        text: "Click on the door to open or close it.",
        onEnter: function () {
            displayArrowMesh(-23.5, 11, 15.5);
        }
    },
    {
        text: "<b>Advanced Note:</b> You can also interact with neighboring objects by pressing the space bar.",
        onEnter: function () {
            hideArrowMesh();
        }
    },
    {
        text: "There are three dialogues at the bottom of the screen. This one lets you talk to other players.",
        onEnter: function () {
            FlashingArrow.show((width, height) => { return [(width - 460) / 2, height - 120 ] });
        }
    },
    {
        text: "This one shows your current inventory and available prayers.",
        onEnter: function () {
            FlashingArrow.show((width, height) => { return [(width - 80) / 2, height - 120] });
        }
    },
    {
        text: "This one shows your skill levels, quest status, and game options. You can also enable or disable music here.",
        onEnter: function () {
            FlashingArrow.show((width, height) => { return [(width+ 300) / 2, height - 120] });
        }
    },
    {
        text: "Start the first quest by talking to your friend.",
        onEnter: function () {
            FlashingArrow.hide();
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
            if (getCharacter().userData.state.q000 == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "You can advance through the dialogue by clicking \"continue\" or using the space bar.",
        onEnter: function () {
            hideArrowMesh();
            nextButton.setDisplay('block');
        }
    },
    {
        text: "You can select a dialogue option using the number keys 1, 2, 3, and 4.",
    },
    {
        text: "Move over to the beach area and select a fishing spot. If you're catching fish too slowly, try another spot.",
        initialTest: function (char) { return char.userData.state.q000 == 1 && char.userData.state.kfie == 0 },
        onEnter: function () {
            displayArrowMesh(0.5, 2, 3.5);
            if (getCharacter().userData.state.kfie == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Great! You caught a fish.",
        onEnter: function () {
            nextButton.setDisplay('block');
        }
    },
    {
        text: "Open your inventory and click on the shrimp, then click on the fire. If you burn all your shrimp, go catch some more!",
        initialTest: function (char) { return char.userData.state.q000 == 1 && char.userData.state.kcoe == 0 },
        onEnter: function () {
            nextButton.setDisplay('block');
            displayArrowMesh(-11.5, 6, 3.5);
            FlashingArrow.show((width, height) => { return [(width - 80) / 2,  height - 120] });
            if (getCharacter().userData.state.kcoe == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Talk to your friend again. <b>Note:</b> You can eat your fish if your health gets low.",
        onEnter: function () {
            nextButton.setDisplay('block');
            FlashingArrow.hide();
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
            if (getCharacter().userData.state.q000 < 2) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "You can equip items by selecting them in your inventory. You can remove them again by clicking on them on your character.",
        initialTest: function (char) { return char.userData.state.q000 == 2 && char.userData.state.kme == 0 },
        onEnter: function () {
            hideArrowMesh();
            nextButton.setDisplay('block');
        }
    },
    {
        text: "Equip the pickaxe and walk over to the copper deposit. Click on the copper deposit to begin mining.",
        onEnter: function () {
            nextButton.setDisplay('block');
            displayArrowMesh(-9, 10, -12.5);
            if (getCharacter().userData.state.kme == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Talk to your friend again.",
        onEnter: function () {
            nextButton.setDisplay('block');
            hideArrowMesh();
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
            if (getCharacter().userData.state.q000 < 3) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Equip your gloves by selecting them in the inventory.",
        initialTest: function (char) { return char.userData.state.q000 == 2 && char.userData.state.ksme == 0 },
        onEnter: function () {
            hideArrowMesh();
            nextButton.setDisplay('block');
        }
    },
    {
        text: "Go inside this building and use your ore on the furnace.",
        onEnter: function () {
            if (getCharacter().userData.state.ksme == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Talk to your friend again.",
        onEnter: function () {
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
            if (getCharacter().userData.state.q000 < 5) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Equip the hammer and use the ingot on the anvil inside. Select the \"copper knife\" option to make a copper knife.",
        initialTest: function (char) { return char.userData.state.q000 == 5 },
        onEnter: function () {
            nextButton.setDisplay('block');
            hideArrowMesh();
            var hasKnife = false;
            var char = getCharacter();
            for (var i = 0; i < 24; i++) {
                var arr = char.userData.state['i' + i];
                if (arr[0] == 'copper_knife') {
                    hasKnife = true;
                }
            }
            if (!hasKnife) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Talk to your friend again.",
        onEnter: function () {
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
            if (getCharacter().userData.state.q000 < 6) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Equip the hatchet and click on a tree.",
        initialTest: function (char) { return char.userData.state.q000 == 6 && getCharacter().userData.state.kfoe == 0 },
        onEnter: function () {
            nextButton.setDisplay('block');
            hideArrowMesh();
            if (getCharacter().userData.state.kfoe == 0) {
                nextButton.setDisplay('none');
            }
        }
    },
    {
        text: "Talk to your friend again.",
        onEnter: function () {
            nextButton.setDisplay('block');
            var friend = getObjectByDisplayName(MainScene, 'Friend')
            if (friend) {
                displayArrowMesh(friend.position.x, 10, friend.position.z);
            } else {
                displayArrowMesh(-20.5, 10, 17.5);
            }
        }
    },
    {
        text: "Congratulations! You've learned all the basics of gameplay.",
        initialTest: function (char) { return char.userData.state.q000 == 6 && getCharacter().userData.state.kfoe != 0},
        onEnter: function () {
            hideArrowMesh();
        }
    },
    {
        text: "You'll learn more about advanced combat techniques as you go. You can examine an equippable item to see its combat bonuses.",
    },
    {
        text: "Now travel to the top of the mountain with food and defeat the king goblin. Watch out for his special attack."
    }
];

var currentPrompt = -1;
function showInitialPrompt(char) {

    container.hide();
    nextButton.setDisplay('block');
    nextButton.setTextContent('Continue')
    nextButton.setBackgroundColor('#2ecc71aa')

    for (var i = 0; i < prompts.length; i++) {
        var prompt = prompts[i];
        if (prompt.initialTest && prompt.initialTest(char)) {
            currentPrompt = i;
            textPanel.setInnerHTML(prompt.text);
            hideArrowMesh();
            FlashingArrow.hide();
            if (prompt.onEnter) prompt.onEnter();
            setTimeout(() => {
                container.onResize();
                container.show();
            }, 0)
            break;
        }
    }
}

function getNextPrompt() {
    currentPrompt += 1;
    if (currentPrompt == prompts.length) {
        container.hide();
        return;
    }
    var prompt = prompts[currentPrompt];
    textPanel.setInnerHTML(prompt.text);
    if (prompt.onEnter) prompt.onEnter();

    if (currentPrompt == prompts.length - 1) {
        nextButton.setTextContent('Finish')
        nextButton.setBackgroundColor('#e74c3caa')
    }

    
}

const container = new Panel()
export default container;
container.setClass('Tutorial');

container.setWidth('400px')
    .setPosition('absolute')
    .setBorderRadius('5px')
container.show = function () {
    container.setDisplay('block');
}
container.hide = function () {
    FlashingArrow.hide();
    hideArrowMesh();
    var character = getCharacter();
    if (character && character.userData.state.zedit == 1 && currentPrompt < 3) {
        CharacterEditor.show();
    }
    currentPrompt = -1;
    container.setDisplay('none');
}
container.hide();
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var right = (width - 400) / 2;
    container.setRight(right + 'px');

    var height = Viewport.dom.offsetHeight;
    var top = (height - yOffset) / 2;
    if (top < 0) top = 0;
    container.setTop(top + 'px');
}

container.getCurrentPrompt = function () {
    return currentPrompt;
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
titlePanel.setTextContent('Tutorial Helper');
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
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc')
    .setFontSize('14px')
container.add(mainPanel)


var textPanel = new Panel()
    .setPadding('10px');
textPanel.setTextContent("Welcome to Reconquer! I'm going to help you get started.")
mainPanel.add(textPanel)

var nextButton = new Button()
    .setWidth('350px')
    .setLeft('20px')
    .setPosition('relative')
    .setBackgroundColor('#2ecc71aa')
    .setMargin('5px')
    .setDisplay('inline-block');
nextButton.setTextContent('Continue');
mainPanel.add(nextButton);
nextButton.onClick((event) => {
    getNextPrompt();
    nextButton.dom.blur();
});

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', () => {
    var char = getCharacter();
    showInitialPrompt(char);
});
Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
    nextButton.setDisplay('block');
    FlashingArrow.hide();
    hideArrowMesh();
});

Signals.subscribe('CloseCharacterEditor', function () {
    if (currentPrompt == 3) {
        getNextPrompt();
    }
})

container.handleChange = function (object, state) {
    if (!getCharacter()) return;
    if (object.userData.uuid == getCharacterId()) {
        if (currentPrompt == 14 && state.q000 == 1) {
            getNextPrompt();
        }
        if (currentPrompt == 17 && getCharacter().userData.state.kfie != 0) {
            getNextPrompt();
        }
        if (currentPrompt == 19 && getCharacter().userData.state.kcoe != 0) {
            getNextPrompt();
        }
        if (currentPrompt == 20 && state.q000 == 2) {
            getNextPrompt();
        }
        if (currentPrompt == 22 && getCharacter().userData.state.kme != 0) {
            getNextPrompt();
        }
        if (currentPrompt == 23 && state.q000 == 3) {
            getNextPrompt();
        }
        if (currentPrompt == 25 && getCharacter().userData.state.ksme != 0) {
            getNextPrompt();
        }
        if (currentPrompt == 26 && state.q000 == 5) {
            getNextPrompt();
        }
        if (currentPrompt == 27) {
            var hasKnife = false;
            for (var i = 0; i < 24; i++) {
                var arr = object.userData.state['i' + i];
                if (arr[0] == 'copper_knife') {
                    hasKnife = true;
                }
            }
            if (hasKnife) {
                getNextPrompt();
            }
        }
        if (currentPrompt == 28 && state.q000 == 6) {
            getNextPrompt();
        }
        if (currentPrompt == 29 && getCharacter().userData.state.kfoe != 0) {
            getNextPrompt();
        }
    }
}