import { definitions } from "./loader.js";
import https from 'https';

export function getSquareString(segX, segY, x, y) {
    return segX + ',' + segY + ',' + Math.floor(x / 8) * 8 + ',' + Math.floor(y / 8) * 8;
}

export function absoluteToGridPoint(absX, absY) {
    var segX = Math.floor(absX / 64);
    var segY = Math.floor(absY / 64);
    var x = absX % 64;
    var y = absY % 64;
    return {
        segX: segX,
        segY: segY,
        x: x,
        y: y
    }
}

export function matchesLocation(a, b) {
    if (!a || !b) return false;
    if (a.lsx != b.lsx
        || a.lsy != b.lsy
        || a.lx != b.lx
        || a.ly != b.ly
        || a.lf != b.lf
        || a.li != b.li
    ) {
        return false;
    }
    return true;
}

export function distanceBetween(a, b) {
    var absAX = a.lsx * 64 + a.lx;
    var absAY = a.lsy * 64 + a.ly;
    var absBX = b.lsx * 64 + b.lx;
    var absBY = b.lsy * 64 + b.ly;
    return Math.abs(absAX - absBX) + Math.abs(absAY - absBY);
}
export function perpendicularDistanceBetween(a, b) {
    var absAX = a.lsx * 64 + a.lx;
    var absAY = a.lsy * 64 + a.ly;
    var absBX = b.lsx * 64 + b.lx;
    var absBY = b.lsy * 64 + b.ly;
    return Math.max(Math.abs(absAX - absBX),Math.abs(absAY - absBY));
}

export function sqrtDistanceBetween(a, b) {
    var absAX = a.lsx * 64 + a.lx;
    var absAY = a.lsy * 64 + a.ly;
    var absBX = b.lsx * 64 + b.lx;
    var absBY = b.lsy * 64 + b.ly;
    var x = absAX - absBX;
    var y = absAY - absBY;
    return Math.sqrt(x * x + y * y);
}

export function angleTo(a, b) {
    var absAX = a.lsx * 64 + a.lx;
    var absAY = a.lsy * 64 + a.ly;
    var absBX = b.lsx * 64 + b.lx;
    var absBY = b.lsy * 64 + b.ly;

    return Math.atan2(absBX - absAX, absBY - absAY) * (2 / Math.PI) + 2;
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function getPlayersAtLocation(loc, worldState) {
    var squareString = getSquareString(loc.lsx, loc.lsy, loc.lx, loc.ly);
    if (!worldState.squares[squareString]) return [];
    return Object.keys(worldState.squares[squareString])
        .filter(x => worldState.serv[x])
        .map(x => worldState.pub[x])
        .filter(x => matchesLocation(x, loc));
}

export function getEntitiesAtLocation(loc, worldState) {
    var squareString = getSquareString(loc.lsx, loc.lsy, loc.lx, loc.ly);
    if (!worldState.squares[squareString]) return [];
    return Object.keys(worldState.squares[squareString])
        .map(x => worldState.pub[x])
        .filter(x => matchesLocation(x, loc));
}

export function getItemsAtLocation(loc, worldState, definitions) {
    var squareString = getSquareString(loc.lsx, loc.lsy, loc.lx, loc.ly);
    if (!worldState.squares[squareString]) return [];
    return Object.keys(worldState.squares[squareString])
        .map(x => worldState.pub[x])
        .filter(x => matchesLocation(x, loc))
        .filter(x => definitions[x.t].itemId || definitions[x.t].isItem);
}

export function getCombatantsAtLocation(loc, worldState) {
    var squareString = getSquareString(loc.lsx, loc.lsy, loc.lx, loc.ly);
    if (!worldState.squares[squareString]) return [];
    return Object.keys(worldState.squares[squareString])
        .map(x => worldState.pub[x])
        .filter(x => matchesLocation(x, loc))
        .filter(x => x.mhp !== undefined);
}

export function getCombatantsNotImmuneToFireAtLocation(loc, worldState) {
    var squareString = getSquareString(loc.lsx, loc.lsy, loc.lx, loc.ly);
    if (!worldState.squares[squareString]) return [];
    return Object.keys(worldState.squares[squareString])
        .map(x => worldState.pub[x])
        .filter(x => matchesLocation(x, loc))
        .filter(x => x.mhp !== undefined && !definitions[x.t].immuneToFire);
}

export function getMatchMap(definitions, name) {
    var map = {};
    for (var type in definitions) {
        var config = definitions[type];
        if (config[name]) {
            var matchObject = config[name];
            if (typeof matchObject == 'string' || typeof matchObject[0] == 'string') {
                map[type] = matchObject;
                continue;
            }
            for (var match of matchObject) {
                var matchString = match.matchString ? match.matchString : '';
                match.matchArray = matchString.split(',').map(x => x.split('='));
            }
            map[type] = config[name];
        }
    }
    return map;
}

export function getMatch(target, id, matchObject) {
    if (typeof matchObject == 'string' || typeof matchObject[0] == 'string') {
        return matchObject;
    }

    for (var entry of matchObject) {
        var checks = entry.matchArray;
        var success = true;
        for (var check of checks) {
            var field = check[0];
            var value = check[1];
            if (field && ((field == 'id' && value != id) || (field != 'id' && target[field] != value))) {
                success = false;
                break;
            }
        }
        if (success) {
            if (entry.chance && Math.random() > entry.chance) continue;
            return entry.result;
        }
    }
    return null;
}

export function canAddToInventory(userPriv, definition) {
    var id = definition.itemId;

    for (var i = 0; i < 24; i++) {
        if (userPriv['i' + i][0] === undefined) {
            return true;
        }
        if (definition.stackable && userPriv['i' + i][0] == id) {
            return true;
        }
    }
    return false;
}
export function addToFirstInventorySlot(userPriv, definition, quantity) {

    if (quantity == 0) return 0;
    if (!definition) return 0;

    var id = definition.itemId;
    if (definition.stackable) {
        for (var i = 0; i < 24; i++) {
            var slot = userPriv['i' + i][0];
            if (slot == id) {
                var oldQuantity = userPriv['i' + i][1];
                var newQuantity = (oldQuantity + quantity);
                if (newQuantity > 10000000) newQuantity = 10000000;
                userPriv['i' + i] = [id, newQuantity];
                return quantity;
            }
        }
        for (var i = 0; i < 24; i++) {
            if (userPriv['i' + i][0] === undefined) {
                userPriv['i' + i] = [id, quantity];
                return quantity;
            }
        }
        return 0;
    }

    var quantityAdded = 0;
    for (var i = 0; i < quantity; i++) {
        if (quantityAdded == quantity) break;
        for (var j = 0; j < 24; j++) {
            if (quantityAdded == quantity) break;
            if (userPriv['i' + j][0] === undefined) {
                userPriv['i' + j] = [id, 1];
                quantityAdded += 1;
            }
        }
    }
    return quantityAdded;
}

export function shopCanAcceptItem(shopOwner, itemId) {
    for (var i = 0; i < 16; i++) {
        if (shopOwner['mi' + i] && (shopOwner['mi' + i].length == 0 || shopOwner['mi' + i][0] == itemId)) {
            return true;
        }
    }
    return false;
}

export function addToFirstShopSlot(shopOwner, itemId, quantity) {
    for (var i = 0; i < 16; i++) {
        if (shopOwner['mi' + i] && shopOwner['mi' + i][0] == itemId) {
            shopOwner['mi' + i][1] += quantity;
            return true;
        }
    }
    for (var i = 0; i < 16; i++) {
        if (shopOwner['mi' + i] && shopOwner['mi' + i].length == 0) {
            shopOwner['mi' + i] = [itemId, quantity];
            return true;
        }
    }
    return false;
}

export function addToFirstTradeSlot(pub, definition, quantity) {
    var id = definition.itemId;
    if (definition.stackable) {
        for (var i = 0; i < 8; i++) {
            var slot = pub['ti' + i][0];
            if (slot == id) {
                var oldQuantity = pub['ti' + i][1];
                var newQuantity = (oldQuantity + quantity);
                if (newQuantity > 10000000) newQuantity = 10000000;
                pub['ti' + i] = [id, newQuantity];
                return true;
            }
        }
    }

    for (var i = 0; i < 8; i++) {
        if (pub['ti' + i][0] === undefined) {
            pub['ti' + i] = [id, quantity];
            return true;
        }
    }
    return false;
}

export function getTotalQuantityOfItemInInventory(itemId, userPriv) {
    var quantity = 0;
    for (var i = 0; i < 24; i++) {
        if (userPriv['i' + i][0] == itemId) {
            quantity += userPriv['i' + i][1];
        }
    }
    return quantity;
}


export function getTotalQuantityOfItemInTrade(itemId, userPub) {
    var quantity = 0;
    for (var i = 0; i < 8; i++) {
        if (userPub['ti' + i][0] == itemId) {
            quantity += userPub['ti' + i][1];
        }
    }
    return quantity;
}

export function getItemSlot(itemId, userPriv) {
    for (var i = 0; i < 24; i++) {
        if (userPriv['i' + i][0] == itemId) {
            return 'i' + i;
        }
    }
}

export function removeAmountFromSlot(slot, quantity, userPriv) {
    userPriv[slot][1] -= quantity;
    if (userPriv[slot][1] <= 0) {
        userPriv[slot] = [];
    }
}

// assumes there is enough to remove
export function removeAmountFromInventory(itemId, quantity, userPriv) {
    var quantityLeft = quantity;
    for (var i = 0; i < 24; i++) {
        if (userPriv['i' + i][0] == itemId) {
            var quantityInSlot = userPriv['i' + i][1];
            if (quantityInSlot > quantityLeft) {
                userPriv['i' + i][1] -= quantityLeft;
                return;
            } else {
                userPriv['i' + i] = [];
                quantityLeft -= quantityInSlot;
            }
        }
        if (quantityLeft == 0) return;
    }
}

export function linearInterpolate(start, end, amount) {
    amount = Math.max(0, Math.min(1, amount));
    return (1 - amount) * start + amount * end;
}

export function calculateCombatLevel(accuracy, strength, defense, health, archery) {
    return Math.max(Math.ceil((1 + (health + defense) / 4 + Math.max((accuracy + strength) / 2, archery))), 1);
}

function generateInfoStringEatBehavior(definition) {
    var str = '';
    if (typeof definition.examineMatch == 'string') {
        str += definition.examineMatch;
    } else {
        str += definition.itemName + '.';
    }

    var healAmount = typeof definition.eatBehavior == 'number' ? definition.eatBehavior : definition.eatBehavior.hitpointsToHeal;

    if (healAmount) {
        str += ' Heals +' + healAmount + '.';
    }

    if (typeof definition.eatBehavior == 'object' && definition.eatBehavior.boost) {
        for (var i = 0; i < definition.eatBehavior.boost.length; i++) {
            var boost = definition.eatBehavior.boost[i];
            str += ' Boosts ' + boost.skill + ' +' + boost.amount + '.';
        }
    }
    
    return str;
}

export function generateInfoString(definition) {
    if (definition.eatBehavior) return generateInfoStringEatBehavior(definition);
    if (!definition.wearBehavior) return '';

    var str = '';
    if (definition.wearBehavior.slot == 'iw') {
        if (definition.wearBehavior.twoHand) {
            str += 'A two-handed '
        } else if (definition.itemId.includes('hammer')) {
            str += 'A hammer and a one-handed '
        } else if (definition.itemId.includes('pickaxe')) {
            str += 'A pickaxe and a one-handed '
        } else if (definition.itemId.includes('knife')) {
            str += 'A knife and a one-handed '
        } else if (definition.itemId.includes('hatchet')) {
            str += 'A hatchet and a one-handed '
        } else {
            str += 'A one-handed '
        }
        var style = 'slash';
        if (definition.attackParameters && definition.attackParameters.animation.includes('crush')) {
            style = 'crush';
        } else if (definition.attackParameters && definition.attackParameters.animation.includes('stab')) {
            style = 'stab';
        } else if (definition.attackParameters && definition.attackParameters.animation.includes('bow')) {
            style = 'archery';
        }
        str += style + ' weapon';
    } else if (definition.wearBehavior.slot == 'in') {
        str += 'A necklace'
    } else if (definition.wearBehavior.slot == 'ihan') {
        str += 'Gloves'
    } else if (definition.wearBehavior.slot == 'if') {
        str += 'Boots'
    } else if (definition.wearBehavior.slot == 'ish') {
        str += 'A shield'
    } else {
        str += 'Armour'
    }

    var bonuses = [];
    if (definition.wearBehavior.accuracy) {
        bonuses.push({type: 'accuracy', amount: definition.wearBehavior.accuracy})
    }
    if (definition.wearBehavior.strength) {
        bonuses.push({type: 'strength', amount: definition.wearBehavior.strength})
    }
    var defense = 0;
    if (definition.wearBehavior.defense) {
        defense = definition.wearBehavior.defense
    }
    if (definition.wearBehavior.slashDefense || defense) {
        var slashDefense = definition.wearBehavior.slashDefense ? definition.wearBehavior.slashDefense : 0;
        bonuses.push({ type: 'slash defense', amount: slashDefense + defense });
    }
    if (definition.wearBehavior.stabDefense || defense) {
        var stabDefense = definition.wearBehavior.stabDefense ? definition.wearBehavior.stabDefense : 0;
        bonuses.push({ type: 'stab defense', amount: stabDefense + defense });
    }
    if (definition.wearBehavior.crushDefense || defense) {
        var crushDefense = definition.wearBehavior.crushDefense ? definition.wearBehavior.crushDefense : 0;
        bonuses.push({ type: 'crush defense', amount: crushDefense + defense });
    }
    if (definition.wearBehavior.archeryDefense || defense) {
        var archeryDefense = definition.wearBehavior.archeryDefense ? definition.wearBehavior.archeryDefense : 0;
        bonuses.push({ type: 'archery defense', amount: archeryDefense + defense });
    }
    if (bonuses.length > 0) {
        str += ' with ';
    }
    bonuses = bonuses.filter(b => b.amount != 0);

    if (!definition.wearBehavior.slashDefense &&
        !definition.wearBehavior.stabDefense &&
        !definition.wearBehavior.crushDefense && 
        !definition.wearBehavior.archeryDefense &&
        definition.wearBehavior.defense
    ) {
        bonuses = bonuses.filter(b => !(b.type == 'slash defense' || b.type == 'stab defense' || b.type == 'crush defense' || b.type == 'archery defense'));
        bonuses.push({ type: 'defense', amount:  definition.wearBehavior.defense });
    }

    for (var i = 0; i < bonuses.length; i++) {
        str += bonuses[i].amount > 0 ? '+' : '';
        str += bonuses[i].amount;
        str += ' ' + bonuses[i].type;

        if (i + 2 == bonuses.length) {
            str += ' and ';
        }
        if (i + 2 < bonuses.length) {
            str += ', ';
        }
    }
    if (bonuses.length == 0) {
        return '';
    }
    return str;
}

export function timeUntilToString(lastReset) {
    var time = lastReset + 21 * 60 * 60 * 1000;
    var timeRemaining = time - Date.now();
    var hours = Math.floor(timeRemaining / 60 / 60 / 1000);
    var minutes = Math.floor((timeRemaining - hours * 60 * 60 * 1000) / 60 / 1000);
    return hours + ' hours and ' + minutes + ' minutes.'
}

// gets all characters within 8-15 tiles
// ensures closest is first
export function getNearbyCharacters(location, d, worldState, includeBarricades) {

    includeBarricades = includeBarricades ? includeBarricades : false;

    var absX = Math.floor(location.lsx * 64 + location.lx);
    var absY = Math.floor(location.lsy * 64 + location.ly);

    var leftToSquare = (absX % 8) + 1;
    var rightToSquare = 8 - (absX % 8);
    var upToSquare = 8 - (absY % 8);
    var downToSquare = (absY % 8) + 1;

    var squares = [
        getSquareString(location.lsx, location.lsy, location.lx, location.ly)
    ]
    if (d >= leftToSquare) {
        squares.push(getSquareString(Math.floor((absX - 8) / 64), Math.floor((absY) / 64), (absX - 8) % 64, (absY) % 64));
        if (d >= upToSquare) {
            squares.push(getSquareString(Math.floor((absX - 8) / 64), Math.floor((absY + 8) / 64), (absX - 8) % 64, (absY + 8) % 64))
        }
        if (d >= downToSquare) {
            squares.push(getSquareString(Math.floor((absX - 8) / 64), Math.floor((absY - 8) / 64), (absX - 8) % 64, (absY - 8) % 64))
        }
    }
    if (d >= rightToSquare) {
        squares.push(getSquareString(Math.floor((absX + 8) / 64), Math.floor((absY) / 64), (absX + 8) % 64, (absY) % 64));
        if (d >= upToSquare) {
            squares.push(getSquareString(Math.floor((absX + 8) / 64), Math.floor((absY + 8) / 64), (absX + 8) % 64, (absY + 8) % 64))
        }
        if (d >= downToSquare) {
            squares.push(getSquareString(Math.floor((absX + 8) / 64), Math.floor((absY - 8) / 64), (absX + 8) % 64, (absY - 8) % 64))
        }
    }
    if (d >= upToSquare) {
        squares.push(getSquareString(Math.floor((absX) / 64), Math.floor((absY + 8) / 64), (absX) % 64, (absY + 8) % 64));
    }
    if (d >= downToSquare) {
        squares.push(getSquareString(Math.floor((absX) / 64), Math.floor((absY - 8) / 64), (absX) % 64, (absY - 8) % 64));
    }

    var closestIndex = -1;
    var closestDistance = Infinity;
    var i = 0;

    var nearby = squares.map((x) => { return Object.keys(worldState.squares[x] ? worldState.squares[x] : []); })
        .flat()
        .filter(x => worldState.serv[x] || (includeBarricades && worldState.priv[x].barricade))
        .map(x => worldState.pub[x])
        .filter(x => {
            var distance = perpendicularDistanceBetween(x, location)
            if (distance < d) {
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
                i += 1;
            }
            return distance < d;
        });
    if (nearby.length > 1 && closestIndex != 0) {
        var temp = nearby[0];
        nearby[0] = nearby[closestIndex]
        nearby[closestIndex] = temp;
    }
    return nearby;
    
}