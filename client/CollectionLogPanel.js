import { Panel, Text } from './UI.js';
import * as Signals from './Signals.js';
import Viewport from './Viewport.js';
import { Config } from './Loader.js';
import * as Thumbnail from './Thumbnail.js';
import { addToolTip, formatItemQuantity } from './Utils.js';

const container = new Panel()
export default container;
container.setClass('CollectionLogPanel');

var mainPanel;

container.setWidth('250px')
    .setHeight('250px')
    .setPosition('absolute')
    .setBorderRadius('5px')
container.show = function (collectionLog) {
    Signals.publish('optionalDialogueShow')
    container.onResize();
    container.setDisplay('block');

    mainPanel.clear();
    for (var i = Config.collectionLog.length -1; i >= 0; i--) {
        var itemId = Config.collectionLog[i];
        // generate thumbnail and add
        var thumbnail = new Panel()
            .setWidth('50px')
            .setHeight('50px')
            .setLeft((i % 5) * 50 + 'px')
            .setTop((Math.floor(i / 5) * 50 + 20) + 'px')
            .setPosition('absolute')
            
        
        var image = Thumbnail.generate(itemId, 1, false)
            .setWidth('50px')
            .setHeight('50px')
            .setPosition('absolute')
            .setCursor('pointer')
            .setOpacity('.2');

        if (collectionLog[itemId]) {
            image.setOpacity(1);
            var quantity = collectionLog[itemId];
            var number = new Text()
                .setTextContent(formatItemQuantity(quantity))
                .setColor('#555555')
                .setFontWeight('bold')
                .setPosition('absolute')
                .setBottom('2px')
                .setLeft('2px')
                .setFontSize('12px')
                .setBorderRadius('2px');
            thumbnail.add(number);

        }
        addToolTip(thumbnail, Config.definitions[itemId].itemName, 80)
        thumbnail.add(image);
        mainPanel.add(thumbnail);
    }
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
titlePanel.setTextContent('Collection Log');
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
mainPanel = new Panel()
    .setWidth('225px')
    .setPadding('10px');
scrollPanel.add(mainPanel);

Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});
Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('optionalDialogueShow', function () {
    container.hide();
})