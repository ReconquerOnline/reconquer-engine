import { Panel, Text } from './UI.js';
import * as Communication from './Communication.js';
import * as Utils from './Utils.js';
import * as Signals from './Signals.js';
import { queueAction } from './Macro.js';
import { clearUseArray, UseArray } from './Inventory.js';

class InteractionsPopup extends Panel {
    constructor() {
        super();
        this.dom.className = 'OptionsPopup';
    }
}

const popup = new InteractionsPopup()
export default popup;

export function create(event, userData, interactions) {
    popup.clear();
    popup
        .setDisplay('block')
        .setPosition('absolute')
        .setOpacity(0.5)
        .setBorder('1px solid black')
        .setPadding('5px')
        .setBorderRadius('3px')
        .setBackgroundColor('#ffffff');
    for (var interaction of interactions) {
        var info = Utils.getDisplayName(userData);
        var displayName = info.displayName;
        var text = new Panel()
            .setBackgroundColor('#ffffff')
            .setCursor('pointer');
        text.add(new Text()
            .setTextContent(interaction.interaction)
            .setFontWeight('bold')
        );
        var nameText = new Text().setTextContent(' ' + displayName)
        text.add(nameText);
        if (info.enemy) {
            nameText.setColor('#e74c3c');
        }
        ((userData, interaction, text) => {
            text.onMouseOver(() => { text.setColor('#555555') });
            text.onMouseOut(() => { text.setColor('#000000') });
            function handleMouseUp(event) {
                if (event.button == 0 || interaction.type == "use") {
                    Communication.interact(userData.uuid, interaction, UseArray);
                } else {
                    queueAction(userData.uuid, interaction);
                    close();
                }
                if (interaction.type == "use") {
                    close();
                }
                if (interaction.type == "on") {
                    clearUseArray();
                }
            }

            text.onMouseUp(handleMouseUp);
            Utils.touchRightClick(text, (event) => {
                downPosition.x = event.clientX;
                downPosition.y = event.clientY;
                handleMouseUp(event)
            })
        })(userData, interaction, text);
        popup.add(text);
    }
    var cancel = new Panel()
        .setBackgroundColor('#ffffff')
        .setCursor('pointer')
        .setTextContent('Cancel');
    cancel.onMouseOver(() => { cancel.setColor('#555555') });
    cancel.onMouseOut(() => { cancel.setColor('#000000') });
    popup.add(cancel);

    var bounds = popup.getBounds();
    var left = Math.max(event.clientX - bounds.width / 2, 0);
    var maxY = window.innerHeight - bounds.height;
    popup
        .setLeft(left + 'px')
        .setTop(Math.min(event.clientY, maxY) + 'px')
}
popup.create = create;

function close() {
    popup.setDisplay('none');
}

document.firstElementChild.addEventListener('click', function (event) {
    if (event.button == 0) close();
})

close();

Signals.subscribe('disconnect', function (message) {
    close();
});