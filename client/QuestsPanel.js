import { Panel } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';

const container = new Panel()
export default container;
container.setClass('QuestsPanel');

container.setWidth('250px')
    .setHeight('250px')
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
    var left = (width - 250) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 125) / 2;
    container.setBottom(bottom + 'px');
}

var headerPanel = new Panel()
    .setWidth('248px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var titlePanel = new Panel()
    .setHeight('18px')
    .setWidth('230px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextAlign('center')
titlePanel.setTextContent('Quests');
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
    .setWidth('248px')
    .setHeight('250px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc')
    .setOverflowY('auto');
container.add(scrollPanel);
var mainPanel = new Panel()
    .setWidth('225px')
    .setPadding('10px');
scrollPanel.add(mainPanel);
container.mainPanel = mainPanel;

Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});
Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('optionalDialogueShow', function () {
    container.hide();
})