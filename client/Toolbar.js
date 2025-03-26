import { Button, Panel } from './UI.js';
import Viewport from './Viewport.js';
import * as Signals from './Signals.js';
import Inventory from './Inventory.js';
import Chat from './Chat.js';
import Info from './Info.js';
import { SVG } from './Loader.js';
import { svgToImage, addToolTip } from './Utils.js';

const container = new Panel()
export default container;
container.setClass('Toolbar');

container.setBackgroundColor('#AAAAAA');
container.setWidth('600px');
container.setHeight('30px');
container.setPosition('absolute')
container.setBottom('0px');
container.setBorderRadius('5px');
container.setOpacity('0.5');
container.setDisplay('none');

var onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 600) / 2;
    container.setLeft(left + 'px');
}

var chatButton = new Button(true);
chatButton.setWidth('190px');
chatButton.setHeight('100%');
chatButton.onToggle(function () {
    inventoryButton.setToggle(false);
    infoButton.setToggle(false);
    Chat.show();
});
chatButton.offToggle(Chat.hide);
container.add(chatButton);


var inventoryButton = new Button(true);
inventoryButton.setWidth('190px');
inventoryButton.setHeight('100%');
inventoryButton.onToggle(function () {
    chatButton.setToggle(false);
    infoButton.setToggle(false);
    Inventory.show();
});
inventoryButton.offToggle(Inventory.hide);
container.add(inventoryButton);

var infoButton = new Button(true);
infoButton.setWidth('190px');
infoButton.setHeight('100%');
infoButton.onToggle(function () {
    chatButton.setToggle(false);
    inventoryButton.setToggle(false);
    Info.show();
});
infoButton.offToggle(Info.hide);
container.add(infoButton);

var expandButton = new Button()
expandButton.setWidth('30px');
expandButton.setHeight('100%');
container.add(expandButton);
expandButton.onMouseOver(function () {
    expandButton.setBackgroundColor('#dddddd');
});
expandButton.onMouseOut(function () {
    expandButton.setBackgroundColor('#ffffff');
});

var state = { chat: false, inventory: false };
function storeState() {
    state.chat = chatButton.getToggle();
    state.inventory = inventoryButton.getToggle();
    state.info = infoButton.getToggle();
}

function restoreState() {
    if (!Chat.isChatActive()) return;

    chatButton.setToggle(state.chat);
    inventoryButton.setToggle(state.inventory);
    infoButton.setToggle(state.info);
    if (state.chat) Chat.show();
    if (state.inventory) Inventory.show()
    if (state.info) Info.show();
    Chat.removeChatPanel();
}

container.setMessage = function (mp) {
    if (JSON.parse(mp).filter(m => !(m.n == '#Link' || m.n == '#CollectionLog')).length == 0) {
        Chat.setMessage(mp)
        return;
    }

    if (!Chat.isChatActive()) storeState();

    inventoryButton.setToggle(false);
    infoButton.setToggle(false);
    chatButton.setToggle(true);

    Chat.setMessage(mp)
}
Signals.subscribe('closeChat', restoreState);
Signals.subscribe('viewportClick', restoreState);
Signals.subscribe('windowResize', onResize);
Signals.subscribe('beginRendering', function () {
    container.setDisplay('block');
    onResize();
});

Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
    inventoryButton.setToggle(false);
    infoButton.setToggle(false);
    chatButton.setToggle(false);
    Chat.removeChatPanel();
});

Signals.subscribe('assetsLoaded', function () {
    chatButton.add(svgToImage(SVG['chat.svg'])
        .setWidth('24px')
        .setHeight('24px')
        .setPosition('absolute')
        .setTop('3px')
        .setLeft('83px')
        .setOpacity('.5'));
    inventoryButton.add(svgToImage(SVG['inventory.svg'])
        .setWidth('24px')
        .setHeight('24px')
        .setPosition('absolute')
        .setTop('3px')
        .setLeft('273px')
        .setOpacity('.5'));
    infoButton.add(svgToImage(SVG['info.svg'])
        .setWidth('24px')
        .setHeight('24px')
        .setPosition('absolute')
        .setTop('3px')
        .setLeft('463px')
        .setOpacity('.5'));

    var expandImage = new svgToImage(SVG['expand.svg'])
        .setWidth('24px')
        .setHeight('24px')
        .setPosition('absolute')
        .setTop('3px')
        .setRight('3px')
        .setOpacity('.5')
    expandButton.add(expandImage);
    expandButton.onClick(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            if (document.body.requestFullscreen) {
                document.body.requestFullscreen();
            } else if (document.body.mozRequestFullScreen) {
                document.body.mozRequestFullScreen();
            } else if (document.body.webkitRequestFullscreen) {
                document.body.webkitRequestFullscreen();
            } else if (document.bodymsRequestFullscreen) {
                document.body.msRequestFullscreen();  
            }
        }
    });
});
