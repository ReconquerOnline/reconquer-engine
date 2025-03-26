function iterate(node, subItems, id) {
    var children = node.listChildren();
    for (var index in children) {
        var child = children[index];
        if (child.getMesh()) {
            var name = child.getName();
            if (!name.startsWith(node.getName())) {
                throw new Error("Invalid sub item name: " + name + ' in ' + id);
            }
            subItems.push(name);
        }
        iterate(child, subItems, id);
    }
}

function handleAsset(id, scene) {
    const numItems = scene.listChildren().length;
    if (numItems != 1) {
        throw new Error('Not exactly one object in file ' + id + '. Found ' + numItems + ' items');
    }
    var object = scene.listChildren()[0];
    if (id != object.getName()) {
        throw new Error('Object name does not match id: ' + id + ' ' + object.getName());
    }
    var subItems = [];
    iterate(object, subItems, id);
    return subItems;
}

function validateAnimations(root) {
    var animations = root.listAnimations();
    var id = root.getDefaultScene().listChildren()[0].getName();
    for (var animation of animations) {
        var animationName = animation.getName();
        if (animationName.toLowerCase() != animationName) {
            throw new Error('Animation must be lowercase for id: ' + id + ' ' + animationName);
        }
        if (!animationName.startsWith(id + '_')) {
            throw new Error('Animation does not follow naming conventions for id: ' + id + ' ' + animationName);
        }
    }
}

function checkIfDuplicateExists(arr) {
    var map = {};
    for (var i = 0; i < arr.length; i++) {
        if (map[arr[i]]) {
            return arr[i];
        }
        map[arr[i]] = true;
    }
    return false;
}

function ValidateAssets(assets) {
    var items = [];
    for (var id in assets) {
        items.push(id);
        var asset = assets[id];
        items = items.concat(handleAsset(id, asset.glb_doc.getRoot().getDefaultScene()));
        validateAnimations(asset.glb_doc.getRoot())
    }
    var duplicateItem = checkIfDuplicateExists(items)
    if (duplicateItem) {
        throw new Error('Duplicate item/subitem name: ' + duplicateItem);
    }
    return true;
}

export default ValidateAssets;