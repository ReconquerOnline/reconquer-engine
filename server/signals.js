import { generateUUID } from "./utils.js";

var topics = {};

export function subscribe(topic, listener) {
    if (!topics[topic]) topics[topic] = {};
    var id = generateUUID();
    topics[topic][id] = listener;
    return {
        remove: function () {
            delete topics[topic][id];
        }
    };
}

export function publish(topic, info) {
    if (!topics[topic]) return;
    for (var id in topics[topic]) {
        if (topics[topic].hasOwnProperty(id)) {
            topics[topic][id](info);
        }
    }
}

export function clear() {
    topics = {}
}