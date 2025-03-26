
export function sendMessage(text, name, options, target, key, worldState) {
    var messages = worldState.priv[key].mp ? JSON.parse(worldState.priv[key].mp) : [];
    messages.push({
        t: text,
        n: name,
        o: options,
        ta: target
    });
    worldState.priv[key].mp = JSON.stringify(messages);
}

export function sendInfoMessage(text, key, worldState) {
    sendMessage(text, undefined, undefined, undefined, key, worldState);
}

// used for examine
export function sendInfoTargetMessage(text, target, key, worldState) {
    sendMessage(text, undefined, undefined, target, key, worldState);
}

// used for talking
export function sendNPCMessage(text, target, key, worldState) {
    sendMessage(text, target.dn, undefined, target.i, key, worldState);
}

export function sendCharacterMessage(text, key, worldState) {
    sendMessage(text, 'You', undefined, key, key, worldState);
}

export function sendOptionMessage(options, target, key, worldState) {
    sendMessage(undefined, 'Select', options, target.i, key, worldState);
}

export function sendLinkMessage(link, key, worldState) {
    sendMessage(link, '#Link', undefined, undefined, key, worldState);
}

export function sendBlockMessage(uuid, key, worldState) {
    sendMessage(uuid, '#Block', undefined, undefined, key, worldState);
}

export function sendCollectionLogMessage(log, key, worldState) {
    sendMessage(JSON.stringify(log), '#CollectionLog', undefined, undefined, key, worldState);
}