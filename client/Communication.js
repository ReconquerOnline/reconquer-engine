import { handleAction } from './Macro.js';
import * as Signals from './Signals.js';

var socket;
var disconnectTimeout;

function loginSocket(username, password, url, callback) {
    socket = io(url);

    disconnectTimeout = setTimeout(() => {
        socket.disconnect();
        Signals.publish('disconnect', 'Could not connect to server.');
    }, 15000);
    socket.on('login', function (msg) {
        clearTimeout(disconnectTimeout);
        Signals.publish('handleLogin', msg);
        if (callback) { callback(msg) }
    });
    socket.on('update', function (msg) {
        Signals.publish('serverUpdate')
        Signals.publish('update', msg);
        clearTimeout(disconnectTimeout);
        disconnectTimeout = setTimeout(() => {
            socket.disconnect();
            Signals.publish('disconnect', 'Lost connection to the server.');
        }, 15000);
    });
    socket.on('shutdown', function (msg) {
        clearTimeout(disconnectTimeout);
        socket.disconnect();
        Signals.publish('disconnect', msg.m);
    });

    socket.on('connect', () => {
        socket.emit('login', {
            u: username,
            p: password,
            v: BUILD_VERSION
        });
    });
}

export function logout() {
    clearTimeout(disconnectTimeout);
    socket.disconnect();
    Signals.publish('disconnect');
}

export function login(username, password, callback) {
    var url = '';
    loginSocket(username, password, url, callback);
}

export function move(segX, segY, x, y) {
    var action = { t: 'move', segX: segX, segY: segY, x: x, y: y };
    handleAction(action);
    socket.emit('update', action);
}

export function interact(target, interaction, useArray) {
    if (interaction.type == 'use') {
        Signals.publish('useItem', target)
        return;
    } else if (interaction.type == 'on') {
        use(useArray, target, interaction)
        return;
    } else if (interaction.type == 'move') {
        move(interaction.segX, interaction.segY, interaction.x, interaction.y)
        return;
    }
    var action = { t: interaction.type, i: interaction.interaction, ta: target };
    handleAction(action);
    socket.emit('update', action);
}

export function use(useArray, target, interaction) {
    var action = { t: 'use', uA: useArray[0], uB: useArray[1], uC: useArray[2], uD: useArray[3], ta: target, i: interaction };
    handleAction(action);
    socket.emit('update', action);
}

export function sendMessage(message) {
    var action = { t: 'message', m: message };
    handleAction(action);
    socket.emit('update', action);
}

export function swapInventory(slotA, slotB) {
    var action = { t: 'inventory', sa: slotA, sb: slotB };
    handleAction(action);
    socket.emit('update', action);
}

export function swapBank(slotA, slotB) {
    var action = { t: 'bank', sa: slotA, sb: slotB };
    handleAction(action);
    socket.emit('update', action);
}

export function update(update) {
    socket.emit('update', update)
}