import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(__dirname, '..', '..');

export default outputPath;