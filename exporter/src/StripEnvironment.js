function StripEnvironment(environment) {
    var segments = environment.getRoot().getDefaultScene().listChildren();
    for (var i = 0; i < segments.length; i++) {
        var segment = segments[i];
        var segmentChildren = segment.listChildren();
        for (var j = 0; j < segmentChildren.length; j++) {
            segment.removeChild(segmentChildren[j]);
        }
    }
}

export default StripEnvironment;