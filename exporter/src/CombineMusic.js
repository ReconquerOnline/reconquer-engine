import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import AssetLibraryPath from './AssetLibraryPath.js';
import OutputPath from './OutputPath.js';

export default function combineMusic() {
    var songs = {};
    var files = fs.readdirSync(AssetLibraryPath + 'music');
    for (var i = 0; i < files.length; i++) {
        var fullPath = path.join(AssetLibraryPath + 'music', files[i]);
        if (/\.mid$/.test(fullPath)) {
            songs[files[i]] = Buffer.from(fs.readFileSync(fullPath)).toString('base64');
        }
    }
    fs.writeFileSync(path.join(OutputPath, 'public', 'assets', 'music.json.zip'), zlib.gzipSync(JSON.stringify(songs)));
}