import express from 'express';
import * as http from 'http';
import * as Database from './database.js';
import { addObject, getUUIDsOfLoggedIn, sendAnnouncement, worldState } from './world_state.js';
import { dropItem } from './action_utils.js';
import { generateUUID } from './utils.js';
import { definitions } from './loader.js';
import behaviors, { addBehavior } from './behaviors.js';

const app = express();
const httpServer = http.createServer(app);
var port = 3002;

var totalUsers = 0;
var currentUsers = 0;
var maxCurrentUsers = 0;

var stats = {};
export function updateStat(name, amount) {
    if (!stats[name]) {
        stats[name] = {}
        stats[name].min = amount;
        stats[name].max = amount;
        stats[name].average = amount;
        stats[name].count = 0;
        stats[name].lastEntries = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    }
    stats[name].average = stats[name].count / (stats[name].count + 1) * stats[name].average + amount / (stats[name].count + 1);
    stats[name].count += 1;
    stats[name].latest = amount;
    stats[name].min = Math.min(stats[name].min, amount);
    stats[name].max = Math.max(stats[name].max, amount);
    stats[name].lastEntries.shift();
    stats[name].lastEntries.push(amount);
}

var users = {};
export function handleLogin(id) {
    totalUsers += 1;
    users[id] = {
        time: Date.now()
    }
    currentUsers = Object.keys(users).length;
    if (currentUsers > maxCurrentUsers) {
        maxCurrentUsers = currentUsers;
    }
}
export function handleLogout(id) {
    if (!users[id]) return;
    updateStat('timePlaying (s)', (Date.now() - users[id].time) / 1000);
    delete users[id];
    currentUsers = Object.keys(users).length;;
}

var lastDatabaseOutput = '';
async function getDatabaseOutput() {
    try {
        lastDatabaseOutput = await Database.getOutput();
    } catch (err) { }
    setTimeout(getDatabaseOutput, 5000);
}
getDatabaseOutput();

// must be sync function in order to print on kill
export function getOutput() {
    var output = '';
    output += 'currentUsers: ' + currentUsers + '\n';
    output += 'ids: ' + JSON.stringify(getUUIDsOfLoggedIn()) + '\n';
    output += 'maxCurrentUsers: ' + maxCurrentUsers + '\n';
    output += 'totalUsers: ' + totalUsers + '\n\n';
    for (var key in stats) {
        output += key + '\n';
        output += 'min: ' + stats[key].min + '\n';
        output += 'max: ' + stats[key].max + '\n';
        output += 'average: ' + stats[key].average + '\n';
        output += 'latest: ' + stats[key].latest + '\n';
        output += 'count: ' + stats[key].count + '\n\n';
        output += 'lastEntries: ' + stats[key].lastEntries + '\n\n';
    }
    output += lastDatabaseOutput;

    return output;
}

app.get('/', function (req, res, next) {
    res.set('Content-Type', 'text/plain');
    res.send(getOutput());
});

app.use(express.json());
app.post('/message', function (req, res, next) {
    if (req.body && req.body.message) {
        console.log('Sending Message:', req.body.message)
        sendAnnouncement(req.body.message);
    }
    res.send('Success\n');
});
app.post('/item', function (req, res, next) {
    if (req.body) {
        console.log('Spawning item:', req.body)
        var type = req.body.t;
        var quantity = req.body.q ? req.body.q : 1;
        if (!type || !quantity ||
            req.body.lsx == undefined ||
            req.body.lsy == undefined ||
            req.body.lx == undefined ||
            req.body.ly == undefined ||
            req.body.lf == undefined ||
            req.body.li == undefined) {
            return res.send('Failure\n');
        }
        dropItem(type, quantity, req.body, worldState)
    }
    res.send('Success\n');
});
app.post('/monster', function (req, res, next) {
    if (req.body) {
        console.log('Spawning monster:', req.body)
        if (!req.body.t ||
            req.body.lsx == undefined ||
            req.body.lsy == undefined ||
            req.body.lx == undefined ||
            req.body.ly == undefined ||
            req.body.lf == undefined ||
            req.body.li == undefined) {
            return res.send('Failure\n');
        }
        var pub = structuredClone(req.body);
        pub.lr = 0;
        pub.i = generateUUID();
        var priv = {
            id: pub.t
        };
        addObject(pub, priv);
        var config = definitions[pub.t];
        if (config && config.behavior) {
            var Behavior = behaviors[config.behavior.type];
            var behaviorConfig = structuredClone(config.behavior);
            behaviorConfig.respawn = false;
            addBehavior(new Behavior({pub: pub, priv: priv}, behaviorConfig));
        }
    }
    res.send('Success\n');
});

httpServer.listen(port, function (err) {
    if (err) console.log(err);
    console.log("Performance monitor listening on port", port);
});
