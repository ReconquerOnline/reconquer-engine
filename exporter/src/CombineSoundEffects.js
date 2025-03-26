import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import AssetLibraryPath from './AssetLibraryPath.js';
import OutputPath from './OutputPath.js';

export default function combineSoundEffects() {
    var songs = {};
    var files = fs.readdirSync(AssetLibraryPath + 'sound_effects');
    for (var i = 0; i < files.length; i++) {
        var fullPath = path.join(AssetLibraryPath + 'sound_effects', files[i]);
        if (/\.ogg$/.test(fullPath)) {
            songs[files[i]] = Buffer.from(fs.readFileSync(fullPath)).toString('base64');
        }
    }
    fs.writeFileSync(path.join(OutputPath, 'public', 'assets', 'sound_effects.json.zip'), zlib.gzipSync(JSON.stringify(songs)));
}