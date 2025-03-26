import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import AssetLibraryPath from './AssetLibraryPath.js';
import OutputPath from './OutputPath.js';

export default function combineSVG() {
    var svgs = {};
    var files = fs.readdirSync(AssetLibraryPath + 'svg');
    for (var i = 0; i < files.length; i++) {
        var fullPath = path.join(AssetLibraryPath + 'svg', files[i]);
        if (/\.svg$/.test(fullPath)) {
            svgs[files[i]] = fs.readFileSync(fullPath, 'utf8');
        }
    }
    fs.writeFileSync(path.join(OutputPath, 'public', 'assets', 'svg.json.zip'), zlib.gzipSync(JSON.stringify(svgs)));
    return svgs;
}