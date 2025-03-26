// adapted from mrdoob http://mrdoob.com/

import { generateUUID } from "./Utils";

export class Element {
    constructor(dom) {
        this.dom = dom;
        this.animations = {};
    }
    setId(id) {
        this.dom.id = id;
        return this;
    }
    setClass(name) {
        this.dom.className = name;
        return this;
    }
    setStyle(style, array) {
        for (var i = 0; i < array.length; i++) {
            this.dom.style[style] = array[i];
        }
    }
    setDisabled(value) {
        this.dom.disabled = value;
        return this;
    }
    setTextContent(value) {
        this.dom.textContent = value;
        return this;
    }
    getTextContent() {
        return this.dom.textContent;
    }
    setInnerHTML(value) {
        this.dom.innerHTML = value;
        return this;
    }
    getStyle(style) {
        var value = this.dom.style[style];
        var number = parseFloat(value);
        if (number.toString() == value)
            return number;
        return value;
    }
    setAttribute(attribute, value) {
        this.dom.setAttribute(attribute, value);
        return this;
    }
    getAttribute(attribute) {
        return this.dom.getAttribute(attribute);
    }
    getBounds() {
        return this.dom.getBoundingClientRect();
    }
    getValue() {
        return this.dom.value;
    }
    setValue(value) {
        this.dom.value = value;
    }
    setSelect(value) {
        this.dom.style.webkitUserSelect = value;
        this.dom.style.MozUserSelect = value;
        this.dom.style.msUserSelect = value;
        return this;
    }
    setContextMenu(value) {
        if (value) {
            this.setAttribute('cancelcontextmenu', 'false');
        } else {
            this.setAttribute('cancelcontextmenu', 'true');
        }
        return this;
    }
    onMouseWheel(callback) {
        var scope = this;
        var onMouseWheel = function (event) {
            var delta = 0;
            if (event.wheelDelta) {
                delta = - event.wheelDelta; // WebKit / Opera / Explorer 9
            } else if (event.detail) {
                delta = event.detail; // Firefox
            }
            callback.call(scope, event, delta);
        };
        this.dom.addEventListener('mousewheel', onMouseWheel, false);
        this.dom.addEventListener('MozMousePixelScroll', onMouseWheel, false); // firefox
    }
};


// properties
var properties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft', 'outline',
    'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'overflowX', 'overflowY', 'margin',
    'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight',
    'paddingBottom', 'color', 'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'textDecoration',
    'textTransform', 'cursor', 'zIndex', 'float', 'visibility', 'borderRadius', 'transform', 'verticalAlign', 'minHeight', 'minWidth',
    'maxWidth', 'maxHeight', 'borderWidth', 'pointerEvents', 'filter', 'whiteSpace'];
properties.forEach(function (property) {
    var setMethod = 'set' + property.substr(0, 1).toUpperCase() + property.substr(1, property.length);
    Element.prototype[setMethod] = function () {
        this.setStyle(property, arguments);
        return this;
    };
    var getMethod = 'get' + property.substr(0, 1).toUpperCase() + property.substr(1, property.length);
    Element.prototype[getMethod] = function () {
        return this.getStyle(property);
    };
});


// events
var events = ['KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'MouseEnter', 'MouseLeave', 'Click', 'DblClick', 'Change', 'MouseDown', 'MouseUp', 'MouseMove',
    'Blur', 'Focus', 'Input', 'ContextMenu', 'DragEnd', 'DragStart', 'DragOver', 'TouchStart', 'TouchEnd', 'TouchMove'];
events.forEach(function (event) {
    var method = 'on' + event;
    Element.prototype[method] = function (callback) {
        this.dom.addEventListener(event.toLowerCase(), callback.bind(this), false);
        return this;
    };
});

export class Panel extends Element {
    constructor() {
        super();
        var dom = document.createElement('div');
        dom.className = 'Panel';
        this.dom = dom;
        this.setSelect('none');
        this.setFontSize('16px');
    }
};

Panel.prototype.add = function (element) {
    this.dom.appendChild(element.dom);
    return this;
};

Panel.prototype.remove = function (element) {
    if (this.dom.contains(element.dom)) this.dom.removeChild(element.dom);
    return this;
};

Panel.prototype.contains = function (element) {
    return this.dom.contains(element.dom);
}

Panel.prototype.clear = function () {
    while (this.dom.children.length) {
        this.dom.removeChild(this.dom.lastChild);
    };
    this.dom.innerText = '';
};

export class Button extends Element {
    constructor(stateful) {
        super();

        var button = this;

        var dom = document.createElement('button');
        dom.className = 'Button';
        button.dom = dom;

        button
            .setBackgroundColor('#ffffff')
            .setCursor('pointer')
            .setBorderColor('#ffffff');

        if (!stateful) return;

        var toggleOnList = [];
        var toggleOffList = [];
        var toggleState = false;

        function setColors() {
            if (toggleState) {
                button.setBackgroundColor('#bbbbbb');
            } else {
                button.setBackgroundColor('#ffffff');
            }
        }

        var handleToggle = function (newState) {
            toggleState = newState;
            setColors();
            var callbacks = newState ? toggleOnList : toggleOffList;
            callbacks.forEach(x => x());
        };
        button.onMouseOver(function () {
            button.setBackgroundColor('#dddddd');
        });
        button.onMouseOut(function () {
            setColors();
        });
        button.onToggle = function (callback) {
            toggleOnList.push(callback);
        };
        button.offToggle = function (callback) {
            toggleOffList.push(callback);
        };
        button.getToggle = function () {
            return toggleState;
        };
        button.setToggle = function (state) {
            handleToggle(state);
        };
        button.onClick(function () {
            handleToggle(!toggleState);
        });

        button.dom.addEventListener("keydown", function(event) {
            if (event.code === "Space") {
                event.preventDefault();
            }
        });
    }
}

Button.prototype.add = function (element) {
    this.dom.appendChild(element.dom);
    return this;
};

export class Text extends Element {
    constructor() {
        super();
        var dom = document.createElement('span');
        dom.className = 'Text';
        this.dom = dom;

        this.setFontSize('16px');
    }
};

export class Image extends Element {
    constructor() {
        super();
        var dom = document.createElement('img');
        dom.className = 'Image';
        this.dom = dom;
    }
};

export class Input extends Element {
    constructor(type) {
        super();
        var dom = document.createElement('input');
        dom.className = 'Input';
        this.dom = dom;
        this.setAttribute('type', type);
    }
};


export class Link extends Element {
    constructor(text, link) {
        super();
        var dom = document.createElement('a');
        dom.className = 'Link';
        this.dom = dom;
        this.setAttribute('href', link);
        this.setAttribute('target', '_blank');
        this.setTextContent(text);
        this.setTextDecoration('none');
    }
};

export class Datalist extends Input {
    constructor(list) {
        super('input');
        var dom = document.createElement('datalist');
        dom.id = generateUUID();
        var options = [];
        for (var i = 0; i < list.length; i++) {
            var option = document.createElement('option');
            option.value = list[i];
            dom.appendChild(option);
            options.push(option);
        }
        this.setAttribute('list', dom.id)
        this.dom.appendChild(dom);

        this.onInput(() => {
            var filterValue = this.dom.value.toLowerCase();
            dom.innerHTML = '';
            for (var option of options) {
                var optionText = option.value.toLowerCase();
                if (optionText.startsWith(filterValue) && !(optionText == filterValue)) {
                    dom.appendChild(option);
                }
            }
        });
    }
};


export class Select extends Element {
    constructor(options) {
        super();
        var dom = document.createElement('select');
        dom.className = 'Select';
        this.dom = dom;
        var index = 0;
        options.forEach(optionText => {
            var option = document.createElement('option');
            option.text = optionText;
            option.value = index;
            index += 1;
            dom.appendChild(option);
        });
    }
};