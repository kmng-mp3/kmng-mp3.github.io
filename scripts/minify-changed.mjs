import fs from 'node:fs/promises';
import path from 'node:path';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminGifsicle from 'imagemin-gifsicle';
import imageminSvgo from 'imagemin-svgo';
import imageminWebp from 'imagemin-webp';

const files = process.argv.slice(2);
if (!files.length) {
    console.log('No files to minify.');
    process.exit(0);
}

const exts = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];

for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) continue;

    try {
        const input = await fs.readFile(file);
        let plugins = [];

        if (ext === '.jpg' || ext === '.jpeg') {
            plugins = [imageminMozjpeg({ quality: 75 })];
        } else if (ext === '.png') {
            plugins = [imageminPngquant({ quality: [0.6, 0.8] })];
        } else if (ext === '.gif') {
            plugins = [imageminGifsicle({ optimizationLevel: 2 })];
        } else if (ext === '.svg') {
            plugins = [imageminSvgo({
                plugins: [
                    { name: 'removeViewBox', active: false },
                    { name: 'removeDimensions', active: false },
                    { name: 'removeMetadata', active: true }
                ]
            })];
        } else if (ext === '.webp') {
            plugins = [imageminWebp({ quality: 75 })];
        }

        const output = await imagemin.buffer(input, { plugins });

        // 画像が小さくなった時だけ上書き
        if (output.length < input.length) {
            await fs.writeFile(file, output);
            console.log(`minified: ${file}  ${input.length} -> ${output.length} bytes`);
        } else {
            console.log(`skipped (no gain): ${file}`);
        }
    } catch (e) {
        console.error(`failed: ${file}`, e);
    }
}
