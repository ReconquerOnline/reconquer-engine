import { Panel, Text, Input } from './UI.js';
import Viewport from './Viewport.js';
import * as Signals from './Signals.js';
import * as Communication from './Communication.js';
import { SVG, getCharacter, getCharacterId } from './Loader.js';
import ChatViewport from './ChatViewport.js';
import { svgToImage } from './Utils.js';
import CollectionLogPanel from './CollectionLogPanel.js';

var steamAuth = new URLSearchParams(window.location.search).get('sa');

const container = new Panel()
export default container;
container.setClass('Chat');

// decorate a Chat/Inventory panel
container.decorate = function (container) {
    container.setWidth('600px');
    container.setHeight('150px');
    container.setPosition('absolute')
    container.setBottom('30px');
    container.setBorderRadius('5px');

    container.show = function () {
        container.setDisplay('block');
        setTimeout(() => messageInput.dom.focus(), 0);
    }

    container.hide = function () {
        container.setDisplay('none');
    }

    container.onResize = function () {
        var width = Viewport.dom.offsetWidth;
        var left = (width - 600) / 2;
        container.setLeft(left + 'px');
    }
}

container.decorate(container);
container.hide();

var background = new Panel()
    .setWidth('100%')
    .setHeight('100%')
    .setOpacity('0.5')
    .setBackgroundColor('#ffffff');
container.add(background)

var chatPanel = new Panel()
    .setPosition('absolute')
    .setTop('0px')
    .setWidth('100%')
    .setHeight('100%');
var nameBox = new Text()
    .setPosition('absolute')
    .setTop('0px')
    .setTextAlign('center')
    .setWidth('450px')
    .setMarginTop('10px')
    .setFontSize('16px')
    .setColor('#e74c3c')
    .setTextContent('Name')
    .setOpacity('0.5');
chatPanel.add(nameBox);
var textBox = new Text()
    .setMargin('20px')
    .setTop('20px')
    .setPosition('absolute')
    .setFontSize('18px')
    .setWidth('410px')
    .setTextAlign('center')
    .setOpacity('0.5');
chatPanel.add(textBox);

function generateOption(top) {
    var option = new Text()
        .setTop(top)
        .setFontSize('18px')
        .setWidth('100%')
        .setTextAlign('center')
        .setDisplay('block')
        .setMarginLeft('10px')
        .setMarginRight('10px')
        .setCursor('pointer')
        .setOpacity('0.5');
    option.onMouseOver(() => { option.setColor('#555555') });
    option.onMouseOut(() => { option.setColor('#000000') });
    option.onClick(() => {
        Communication.interact(option.target, {
            type: 'talk',
            interaction: option.dom.textContent
        });
    })
    return option;
}

var optionsPanel = new Panel()
    .setWidth('430px')
    .setLeft('150px')
    .setPosition('absolute');
chatPanel.add(optionsPanel);
var options = [
    generateOption('24px'),
    generateOption('48px'),
    generateOption('72px'),
    generateOption('96px')
];
options.forEach(option => {
    optionsPanel.add(option);
});

chatPanel.add(ChatViewport);

var svgPanel = new Panel()
    .setWidth('150px')
    .setHeight('150px')
    .setPosition('absolute')
    .setRight('0px')
    .setTop('0px');
chatPanel.add(svgPanel);

var bottomButton = new Text()
    .setTextContent('Close')
    .setPosition('absolute')
    .setBottom('5px')
    .setWidth('450px')
    .setTextAlign('center')
    .setCursor('pointer')
    .setOpacity('0.5');
bottomButton.onMouseOver(() => { bottomButton.setColor('#555555') });
bottomButton.onMouseOut(() => { bottomButton.setColor('#000000') });
bottomButton.onClick(() => { container.displayMessage() });
chatPanel.add(bottomButton);

var messagePanel = new Panel()
    .setPosition('absolute')
    .setTop('0px')
    .setMargin('40px');
var userName = new Text()
    .setTextContent('You:')
    .setFontSize('18px')
    .setDisplay('inline-block')
    .setMarginRight('5px')
    .setOpacity('0.5');
messagePanel.add(userName);
Signals.subscribe('displayNameChange', (object) => {
    userName.setTextContent(object.userData.state.dn + ':');
});
var messageInput = new Input('text')
    .setFontSize('18px')
    .setWidth('400px')
    .setAttribute('maxLength', '40')
    .setOpacity('0.5');
messageInput.onKeyDown((event) => {
    if (event.key === 'Enter') {
        var message = messageInput.getValue();
        if (message != '') {
            Communication.sendMessage(message);
        }
        messageInput.setValue('');
    }
    event.stopPropagation();
})
messagePanel.add(messageInput);

function displayPanel(panel) {
    container.remove(messagePanel);
    container.remove(chatPanel);
    container.add(panel);
}

var remainingMessages = [];
container.displayMessage = function() {
    if (remainingMessages.length == 0) {
        Signals.publish('closeChat');
        return;
    }
    svgPanel.setDisplay('none');

    var message = remainingMessages[0];
    textBox.setTextContent(message.t ? message.t : '');
    nameBox.setTextContent(message.n ? message.n : '');
    for (var i = 0; i < 4; i++) {
        options[i]
            .setTextContent(message.o && message.o[i] ? message.o[i] : '')
            .setColor('#000000');
        options[i].target = message.ta;
    }
    if (remainingMessages.length > 1) {
        bottomButton.setTextContent('Continue');
    } else {
        bottomButton.setTextContent('Close');
    }
    bottomButton.setColor('#000000');
    if (message.t && message.ta && message.ta != getCharacterId()) {
        ChatViewport.setRight('0px').setLeft('initial').setDisplay('block');
        textBox.setLeft('0px');
        nameBox.setLeft('0px');
        bottomButton.setLeft('0px');
    } else if (message.o || message.ta) {
        ChatViewport.setLeft('0px').setRight('initial').setDisplay('block');
        textBox.setLeft('150px');
        nameBox.setLeft('150px');
        bottomButton.setLeft('150px');
    } else {
        ChatViewport.setDisplay('none');
        textBox.setLeft('75px');
        nameBox.setLeft('75px');
        bottomButton.setLeft('75px');
    }

    if (message.ta) {
        if (SVG[message.ta]) {
            svgPanel.clear();
            svgPanel.setDisplay('block');
            ChatViewport.setDisplay('none');
            var image = svgToImage(SVG[message.ta]);
            image.setWidth('150px')
            image.setHeight('150px')
            svgPanel.add(image);
        } else {
            ChatViewport.setItem(message.o ? getCharacterId() : message.ta);
        }
    }

    setTimeout(() => {
        textBox.setTop(55 - textBox.getBounds().height / 2 + 'px');
        optionsPanel.setTop(75 - optionsPanel.getBounds().height / 2 + 'px');
    }, 0);

    displayPanel(chatPanel);
    remainingMessages.shift();
}
container.isSelect = function(){
    if (nameBox.getTextContent() == 'Select') return true;
    return false;
}
container.selectOption = function (option) {
    if (container.isSelect() && options[option].getTextContent() != '') {
        var option = options[option];
        Communication.interact(option.target, {
            type: 'talk',
            interaction: option.dom.textContent
        });
    }
}
container.setMessage = function (mp) {

    var messages = JSON.parse(mp);
    var newMessages = [];
    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];

        if (message.n == '#Block') {
            // add to block list
            var char = getCharacter();
            var blockList = localStorage.getItem(char.userData.uuid + '_blockList') ? JSON.parse(localStorage.getItem(char.userData.uuid + '_blockList')) : [];
            blockList.push(message.t);
            localStorage.setItem(char.userData.uuid + '_blockList', JSON.stringify(blockList));
            continue;
        }
        if (message.n == '#CollectionLog') {
            var log = JSON.parse(message.t);
            CollectionLogPanel.show(log);
            continue;
        }
        newMessages.push(message);
    }
    if (newMessages.length == 0) return 0;
    remainingMessages = newMessages;

    container.displayMessage();

    return true;
}

container.isChatActive = function () {
    return container.contains(chatPanel);
}

container.removeChatPanel = function () {
    displayPanel(messagePanel);
}

displayPanel(messagePanel);

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);