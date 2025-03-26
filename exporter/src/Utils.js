export function extractFloor(name, parentName) {
    var nameMatch = name.match(/floor\d/g);
    if (nameMatch) {
        return Number(nameMatch[0].substring(5));
    }

    if (!parentName) return 0;
    var parentNameMatch = parentName.match(/floor\d/g);
    if (parentNameMatch) {
        return Number(parentNameMatch[0].substring(5));
    }
    return 0;
}

export function lookupItemInMap(id, mapToCheck) {
    var splitId = id.split('.');
    for (var i = 0; i < splitId.length; i++) {
        var subId = splitId.slice(0, splitId.length - i).join('.');
        if (mapToCheck[subId]) {
            return mapToCheck[subId]
        }
    }
    return null;
}