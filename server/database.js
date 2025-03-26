import ConfigOptions from "./config_options.js";
import { adjectives, names } from "./loader.js";
import { generateUUID } from "./utils.js";
import fs from 'fs';

var accounts = {};

// local JSON database, not great for production
function saveDatabase() {
    var data = JSON.stringify(accounts);
    fs.writeFile('database.json', data, err => {
        // save every minute in case the server crashes
        setTimeout(saveDatabase, 60000)
    })
}
try {
    accounts = JSON.parse(fs.readFileSync('database.json'));
} catch (err) {
    // ignore
}
saveDatabase();

export async function initialize() {

}

export function close() {
    var data = JSON.stringify(accounts);
    fs.writeFileSync('database.json', data);
}

function numberToRomanNumeral(number) {
    var romanNumeralMap = {
        1000: 'M',
        900: 'CM',
        500: 'D',
        400: 'CD',
        100: 'C',
        90: 'XC',
        50: 'L',
        40: 'XL',
        10: 'X',
        9: 'IX',
        5: 'V',
        4: 'IV',
        1: 'I'
    };
    var values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    var romanNumeral = '';
    for (const value of values) {
        while (number >= value) {
            romanNumeral += romanNumeralMap[value];
            number -= value;
        }
    }

    return romanNumeral;
}

function isUniqueDisplayName(name) {
    for (var key in accounts) {
        var account = accounts[key];
        if (account.pub && account.pub.dn == name) {
            return false;
        }
    }
    return true;
}

export async function getUniqueDisplayName(name, descriptor) {
    if (!name) name = names[Math.floor(Math.random() * names.length / 2)];
    if (!descriptor) descriptor = adjectives[Math.floor(Math.random() * adjectives.length)];
    var displayName = name + ' the ' + descriptor;
    // see if exists, keep adding new number and checking

    var number = 0;
    var iteration = 0;
    while (!isUniqueDisplayName(displayName)) {
        iteration += 1;
        number = number + iteration + Math.floor(Math.random() * iteration * iteration);
        var numeral = numberToRomanNumeral(number);
        displayName = name + ' the ' + descriptor + ' ' + numeral;
    }

    return displayName;
}

export async function validateLogin(email, otp) {

    if (accounts[email] && accounts[email].otp == otp) {
        return {
            i: accounts[email].pub.i,
            otp: accounts[email].otp
        }
    }

    var info = {
        i: generateUUID(),
        otp: generateUUID()
    };

    accounts[info.i] = {
        uuid: info.i,
        otp: info.otp
    }

    return info;
}

export async function resetAccount(key) {
    delete accounts[key];
}

function applyUpdates(data) {
    if (data.serv.tp === undefined) { // tracking for prayer usage
        data.serv.tp = 100;
    }
    if (data.priv.fid === undefined) { // current fidelity prayers
        data.priv.fid = 0;
    }
    if (data.priv.q001 === undefined) {
        data.priv.q001 = 0;
    }
    if (data.priv.chat === undefined) { // whether chat is disabled
        data.priv.chat = 1;
    }
    if (data.priv.music === undefined) { // whether music is enabled
        data.priv.music = 1;
    }
    if (data.priv.sfx === undefined) { // whether sfx are enabled
        data.priv.sfx = 1;
    }
    if (data.pub.snm === undefined) {
        data.pub.snm = 0;
    }
    if (data.priv.q002 === undefined) {
        data.priv.q002 = 0;
    }
    if (data.pub.sfm === undefined) {
        data.pub.sfm = 0;
    }
    if (data.pub.shanm === undefined) {
        data.pub.shanm = 0;
    }
    if (data.priv.q003 === undefined) {
        data.priv.q003 = 0;
    }
    if (data.pub.li === undefined) {
        data.pub.li = 0;
    }
    if (data.serv.olsx === undefined) {
        data.serv.olsx = data.pub.lsx;
    }
    if (data.serv.olsy === undefined) {
        data.serv.olsy = data.pub.lsy;
    }
    if (data.serv.olx === undefined) {
        data.serv.olx = data.pub.olx;
    }
    if (data.serv.oly === undefined) {
        data.serv.oly = data.pub.oly;
    }
    if (data.serv.olf === undefined) {
        data.serv.olf = data.pub.olf;
    }
    if (data.serv.olr === undefined) {
        data.serv.olr = data.pub.olr;
    }
    if (data.serv.dl === undefined) {
        data.serv.dl = 0;
    }
    if (data.priv.q004 === undefined) {
        data.priv.q004 = 0;
    }
    for (var i = 0; i < 64; i++) {
        if (data.priv['bi' + i] === undefined) {
            data.priv['bi' + i] = [];
        }
    }
    if (data.priv.msb === undefined) {
        data.priv.msb = 0;
    }
    if (data.priv.q005 === undefined) {
        data.priv.q005 = 0;
    }
    if (data.priv.q005t === undefined) {
        data.priv.q005t = 0;
    }
    if (data.priv.q006 === undefined) {
        data.priv.q006 = 0;
    }
    if (data.priv.q007 === undefined) {
        data.priv.q007 = 0;
    }
    if (data.priv.q007t === undefined) {
        data.priv.q007t = 0;
    }
    if (data.pub.swbm === undefined) {
        data.pub.swbm = 0;
    }
    if (data.priv.q008 === undefined) {
        data.priv.q008 = 0;
    }
    if (data.priv.q009 === undefined) {
        data.priv.q009 = 0;
    }
    // local instance
    if (data.priv['cid.gardener.she'] === undefined) {
        data.priv['cid.gardener.she'] = 7;
    }
    if (data.priv.q010 === undefined) {
        data.priv.q010 = 0;
    }
    if (data.priv['cid.dock_canoe.ss'] === undefined) {
        data.priv['cid.dock_canoe.ss'] = 0;
    }
    if (data.priv['cid.dock_canoe.si'] === undefined) {
        data.priv['cid.dock_canoe.si'] = 0;
    }

    if (data.priv['dock.500-500.ss'] === undefined) {
        data.priv['dock.500-500.ss'] = 0;
    }
    if (data.priv['dock.500-500.si'] === undefined) {
        data.priv['dock.500-500.si'] = 0;
    }
    if (data.priv['dock.499-500.ss'] === 1) {
        data.priv['dock.500-500.ss'] = 1;
        data.priv['dock.500-500.si'] = 1;
    }
    if (data.pub.ma === undefined) {
        data.pub.ma = 0;
    }
    if (data.serv.collection === undefined) {
        data.serv.collection = {};
    }
    if (data.serv.perm === undefined) {
        data.serv.perm = 0;
    }
    if (data.serv.messages === undefined) {
        data.serv.messages = [];
    }
    if (data.serv.muted === undefined) {
        data.serv.muted = 0;
    }
    if (data.priv.graphics === undefined) {
        data.priv.graphics = 6;
    }
    // disable left click rotate
    if (data.priv.dlcr === undefined) {
        data.priv.dlcr = 0;
    }
    if (data.priv.hroof === undefined) {
        data.priv.hroof = 0;
    }
    if (data.priv.q011 === undefined) {
        data.priv.q011 = 0;
    }
    if (data.serv.fidelityLoss === undefined) {
        data.serv.fidelityLoss = 1000;
    }
    if (data.serv.fidelityLossTime === undefined) {
        data.serv.fidelityLossTime = Date.now();
    }
    if (data.pub.en === undefined) {
        data.pub.en = 0;
    }
    if (data.priv.q012 === undefined) {
        data.priv.q012 = 0;
    }
    if (data.serv.raidOneScore === undefined) {
        data.serv.raidOneScore = 0;
    }
    if (data.priv.hxp === undefined) { // hide xp
        data.priv.hxp = 0;
    }
    if (data.pub.w === undefined) {
        data.priv.w = 0;
    }
    if (data.pub.li != 0) {
        // override location with old locations and set instance to 0
        data.pub.li = 0;
        data.pub.lsx = data.serv.olsx;
        data.pub.lsy = data.serv.olsy;
        data.pub.lx = data.serv.olx;
        data.pub.ly = data.serv.oly;
        data.pub.lf = data.serv.olf;
        data.pub.lr = data.serv.olr;
    }

    return data;
}

async function getInitialUserData(id) {
    var displayName = await getUniqueDisplayName();
    var initialHair = 2;
    var initialBeard = 0;

    var xSpawnPoints = [4, 6, 8];
    var ySpawnPoints = [14, 12, 10];

    var data = {
        pub: {
            i: id,
            dn: displayName,
            lsx: 500,
            lsy: 500,
            lx: xSpawnPoints[Math.floor(Math.random() * xSpawnPoints.length)],
            ly: ySpawnPoints[Math.floor(Math.random() * ySpawnPoints.length)],
            lr: 0,
            lf: 0,
            t: 'character',

            sha: initialHair,
            sham: Math.floor(Math.random() * 4),
            se: 0,
            sem: Math.floor(Math.random() * 6),
            sno: 0,
            sbe: initialBeard,
            sshim: Math.floor(Math.random() * 5),
            spm: Math.floor(Math.random() * 6),
            ssm: 0,

            she: 0,
            shm: 0,
            sa: 0,
            sn: 0,
            ss: 0,
            sb: 0,
            sl: 0,
            sf: 0,
            shan: 0,
            sw: 0,
            ssh: 0,
            sam: 0,
            sbm: 0,
            slm: 0,
            swm: 0,
            sshm: 0,
            si: 0,
            hp: 10,
            mhp: 10,
            cbl: 5,
            m: '', // message public

            ti0: [],
            ti1: [],
            ti2: [],
            ti3: [],
            ti4: [],
            ti5: [],
            ti6: [],
            ti7: [],

            mps: 0, // player trade state
            at: '' // attack target
        },
        priv: {
            mp: '', // message private
            mss: 0, // show shop
            mst: null, // shop target
            msp: 0, // show player trade
            mpt: null, // player trade target
            msis: 0, // smithing interface state
            msit: null, // smithing interface target

            i0: [],
            i1: [],
            i2: [],
            i3: [],
            i4: [],
            i5: [],
            i6: [],
            i7: [],
            i8: [],
            i9: [],
            i10: [],
            i11: [],
            i12: [],
            i13: [],
            i14: [],
            i15: [],
            i16: [],
            i17: [],
            i18: [],
            i19: [],
            i20: [],
            i21: [],
            i22: [],
            i23: [],

            ihe: '', // helmet
            in: '', // necklace
            ib: '', // body
            il: '', // legs
            if: '', // feet
            ihan: '', // hands
            ish: '', // shield
            iw: '', // weapon

            khe: 250, // health
            kae: 0, // accuracy xp
            kal: 1, // accuracy base level
            kac: 1, // accuracy current level
            kde: 0, // defense
            kdl: 1,
            kdc: 1,
            kse: 0, // strength
            ksl: 1,
            ksc: 1,
            kfe: 0, // fidelity
            kfl: 1,
            kfc: 1,
            kare: 0, // archery
            karl: 1,
            karc: 1,
            kfie: 0, // fishing
            kfil: 1,
            kfic: 1,
            kfoe: 0, // forestry
            kfol: 1,
            kfoc: 1,
            kcoe: 0, // cooking
            kcol: 1,
            kcoc: 1,
            kme: 0, // mining
            kml: 1,
            kmc: 1,
            ksme: 0, // smithing
            ksml: 1,
            ksmc: 1,
            kce: 0, // crafting
            kcl: 1,
            kcc: 1,
            kfae: 0, // farming
            kfal: 1,
            kfac: 1,

            eacc: 0, // equipment bonuses
            estr: 0,
            edef: 0,
            esld: 0,
            estd: 0,
            ecrd: 0,
            eard: 0,

            zha: initialHair,  // initial hair state
            zbe: initialBeard, // initial beard
            zedit: 1, // whether the character is editable

            q000: 0, // quest states

            // user local object states
            'dock.500-500.ss': 0,
            'dock.500-500.si': 0,

            tr: 0, // remaining ticks, updated only on login
            mem: 0 // membership status
        },
        serv: {
            mt: 0, // message ticks
            tc: 0, // tick count
            tr: 24000, // remaining ticks, updated every tick
            trt: Date.now() - 24 * 60 * 60 * 1000,
            ds: 0, // number of deaths
        }
    };
    return applyUpdates(data);
}

export async function getUserInfo(id) {
    if (accounts[id] && accounts[id].pub) {
        return accounts[id];
    }
    var data = await getInitialUserData(id);
    accounts[id].pub = structuredClone(data.pub);
    accounts[id].priv = structuredClone(data.priv);
    accounts[id].serv = structuredClone(data.serv);
    return data;
}

export async function updateDisplayName(uuid, displayName) {
    accounts[uuid].displayName = displayName;
    return true;
}

export async function handleLogout(uuid) {

}

export async function saveUserInfo(user) {
    var userCopy = structuredClone(user)
    userCopy.uuid = userCopy.pub.i;
    userCopy.pub.sa = 0;
    userCopy.pub.ma = 0;
    userCopy.priv.fid = 0;
    userCopy.priv.mpt = null;
    userCopy.displayName = userCopy.pub.dn;
    userCopy.otp = accounts[userCopy.uuid].otp;
    userCopy.serv.messages = [];
    accounts[userCopy.uuid] = userCopy;
}

export async function getOutput() {
    var output = 'num accounts: ' + Object.keys(accounts).length + '\n';
    return output;
}