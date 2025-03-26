var segmentNameRegex = /^Seg-\d\d\d-\d\d\d/;

function validateSegmentName(name) {
    return segmentNameRegex.test(name);
}

function validateTopLevelItemName(itemName, assets, configFiles) {
    for (var id in assets) {
        if (itemName.startsWith(id)) {
            return true;
        }
    }
    for (var id in configFiles) {
        if (itemName.startsWith(id)) {
            return true;
        }
    }
    if (itemName.includes('collision')) {
        return true;
    }
    return false;
}

function validateTopLevelItems(items, assets, configFiles) {
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemName = item.getName();
        if (!validateTopLevelItemName(itemName, assets, configFiles)) {
            throw new Error('Invalid top level item name in environment: ' + itemName);
        }
    }
}

function validateSegments(environment, assets, configFiles) {
    var segments = environment.listChildren();
    for (var index in segments) {
        var child = segments[index];
        if (!validateSegmentName(child.getName())) {
            throw new Error('Invalid segment name: ' + child.getName());
        }
        validateTopLevelItems(child.listChildren(), assets, configFiles);
    }
}

function ValidateEnvironment(environment, assets, configFiles) {
    validateSegments(environment.getRoot().getDefaultScene(), assets, configFiles);
}

export default ValidateEnvironment;