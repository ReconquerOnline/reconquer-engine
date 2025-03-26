import ConfigOptions from './server/config_options.js';

import express from 'express';
import * as path from 'path';
import * as http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as Database from './server/database.js';
import * as WorldState from './server/world_state.js';
import Actions from './server/actions.js';
import * as PerformanceMonitor from './server/performance_monitor.js';
import * as Environment from './server/environment.js';
import version from './server/version.js';

Environment.load();
await Database.initialize();

const app = express();
const httpServer = http.createServer(app);
var io = new Server(httpServer,
    {
        maxHttpBufferSize: ConfigOptions.maxIncomingMessageSize
    });
var port = 3000;
const __dirname = path.dirname(fileURLToPath(
    import.meta.url));

app.use('/dist', express.static(path.join(__dirname, 'dist')));

app.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/status', function (req, res, next) {
    res.json({
        users: WorldState.getNumberLoggedIn(),
        capacity: ConfigOptions.maxClients,
        location: process.env.SERVER_LOCATION,
        name: process.env.SERVER_NAME
    });
});

app.use(express.json());

var updateRateLimiter = new RateLimiterMemory({ points: ConfigOptions.updateRateLimit, duration: 1 });
var loginRateLimiter = new RateLimiterMemory({ points: ConfigOptions.maxLoginsPerHourPerIP, duration: 60 * 60 });
var users = {};
var ipCounts = {};

io.on('connection', function (socket) {
    var address = socket.handshake.headers["x-forwarded-for"] || '127.0.0.1';

    loginRateLimiter.consume(address).then(() => {
        // disconnect if not authenticated quickly enough
        var timeout = setTimeout(() => {
            if (!socket.user) socket.disconnect();
        }, 15000);

        socket.on('login', async (msg) => {
            if (socket.user) return;
            if (WorldState.isLoggedIn(socket.user)) {
                return;
            };
            if (msg.v != version) {
                socket.emit('login', { e: 'Game update available. Please refresh your browser.' });
                return socket.disconnect();
            }
            try {
                var user = msg.u ? msg.u.toLowerCase() : null;

                var info = null;
                info = await Database.validateLogin(user, msg.p);
                socket.user = info.i;
                if (WorldState.getNumberLoggedIn() >= ConfigOptions.maxClients) {
                    socket.emit('login', { e: 'Sorry, the world is full right now. Please try again later' });
                    return socket.disconnect();
                }
                var userInfo = await Database.getUserInfo(info.i);
                if (WorldState.isLoggedIn(info.i)) {
                    socket.emit('login', { e: 'Account already logged in' });
                    return socket.disconnect();
                }
                ipCounts[address] = ipCounts[address] ? ipCounts[address] : 0;
                if (ipCounts[address] >= ConfigOptions.maxCurrentUsersPerIP) {
                    socket.emit('login', { e: 'Too many simultaneous logins' });
                    return socket.disconnect();
                }

                socket.on('disconnect', function () {
                    if (!socket.user) return;
                    PerformanceMonitor.handleLogout(socket.user);
                    delete users[socket.user];
                    if (ipCounts[address]) {
                        ipCounts[address] -= 1;
                        if (ipCounts[address] == 0) delete ipCounts[address];
                    }
                    WorldState.handleLogout(socket.user);
                    Database.handleLogout(socket.user);
                });

                if (Date.now() > userInfo.serv.trt + 21 * 60 * 60 * 1000) { // 21 hours after last reset
                    userInfo.serv.dl = 0;
                    userInfo.serv.trt = Date.now();

                }
                if (Date.now() > userInfo.serv.fidelityLossTime + 180 * 24 * 60 * 60 * 1000) { // 6 month reset
                    userInfo.serv.fidelityLossTime = Date.now();
                    userInfo.serv.fidelityLoss = 1000;
                }

                // unlimited playtime with 4 hour timeout
                userInfo.serv.tr = 28800;

                userInfo.serv.dl += 1;
                if (userInfo.serv.dl > ConfigOptions.maxDailyLoginsPerAccount) {
                    socket.emit('login', { e: 'Reached max daily logins for this account.' });
                    return socket.disconnect();
                }

                userInfo.priv.tr = userInfo.serv.tr;

                socket.emit('login', info);
                ipCounts[address] += 1;
                PerformanceMonitor.handleLogin(info.i);
                users[info.i] = {
                    socket: socket
                };
                clearTimeout(timeout);
                WorldState.handleLogin(userInfo);
            } catch (err) {
                if (typeof err == 'string') {
                    socket.emit('login', { e: err });
                    return socket.disconnect();
                }
                throw err;
            }
        });

        socket.on('update', (msg) => {
            if (!WorldState.isLoggedIn(socket.user)) { return socket.disconnect(); }
            updateRateLimiter.consume(address).then(() => {
                var Action = Actions[msg.t];
                if (Action && Action.validate(msg)) {
                    var action = new Action(msg)
                    var persist = true;
                    if (action.handleImmediate) {
                        persist = WorldState.handleImmediate(socket.user, action);
                    }
                    if (persist) {
                        WorldState.addAction(socket.user, action);
                    }
                }
            }).catch(() => { });
        });

    }).catch((err) => {
        console.log('Login error:', address, err);
        socket.emit('login', { e: 'Too many connection attempts.' });
        socket.disconnect();
    });
});

var cancel = false;
var lastSendTime = Date.now();
var averageCalcTime = 0;
var handleTick = function () {
    if (cancel) return;
    var beginCalcTime = Date.now();
    var diffs = WorldState.handleNextTick();
    var endCalcTime = Date.now();
    var calcTime = endCalcTime - beginCalcTime;
    PerformanceMonitor.updateStat('calcTime (ms)', calcTime);
    averageCalcTime = .9 * averageCalcTime + .1 * calcTime;
    setTimeout(function () {
        if (cancel) return;
        var beginSendTime = Date.now();
        lastSendTime = beginSendTime;
        for (var key in users) {
            if (!WorldState.isLoggedIn(key)) {
                users[key].socket.emit('shutdown', { m: "You've been logged out." });
                users[key].socket.disconnect();
                continue;
            }
            var user = users[key];
            user.socket.emit('update', { t: beginSendTime, d: diffs[key] });
        }
        var endSendTime = Date.now();
        var sendTime = endSendTime - beginSendTime;
        PerformanceMonitor.updateStat('sendTime (ms)', sendTime);
        for (var key in users) {
            if (WorldState.isTimedOut(key)) {
                users[key].socket.emit('shutdown', { m: "You've reached the four hour log out timer. Please log back in." });
                users[key].socket.disconnect();
                WorldState.handleLogout(key);
                Database.handleLogout(key);
            }
        }
        setTimeout(handleTick, Math.max(500 - 2 * averageCalcTime - sendTime, 0));
    }, 500 - (endCalcTime - lastSendTime));
}
if (!process.argv.includes('minimal')) {
    handleTick();
} else {
    console.log('Starting in minimal mode.')
    io.off('connection', io.listeners('connection')[0]); 
}

httpServer.listen(port, function (err) {
    if (err) console.log(err);
    console.log("Server listening on port", port, '\nStart Time: ', new Date().toISOString());
});

async function exitHandler(err) {
    cancel = true;
    console.log('\nExit Time: ', new Date().toISOString());
    console.log('\n' + err);
    if (err.stack) console.log('\n' + err.stack);
    console.log('\nOutputting performance info:');
    console.log(PerformanceMonitor.getOutput());
    for (var key in users) {
        users[key].socket.emit('shutdown', { m: 'Server shut down for maintenance.' });
        await WorldState.handleLogout(key);
        await Database.handleLogout(key);
    }
    Database.close();
    process.exit();
}
process.on('SIGINT', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('uncaughtExceptionMonitor', exitHandler);
