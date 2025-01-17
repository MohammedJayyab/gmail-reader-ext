import * as esbuild from 'esbuild';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const watch = process.argv.includes('--watch');

// Function to ensure directory exists
async function ensureDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

// Function to copy file if it exists
async function copyFileIfExists(src, dest) {
    try {
        await fs.copyFile(src, dest);
        console.log(`Copied: ${src} -> ${dest}`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`Warning: Source file not found: ${src}`);
        } else {
            throw error;
        }
    }
}

// Function to check if file exists
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Function to find valid entry points
async function getValidEntryPoints() {
    const files = ['popup.js', 'content.js', 'ai-service.js'];
    const validEntryPoints = [];

    for (const file of files) {
        const srcPath = path.join('src', file);
        if (await fileExists(srcPath)) {
            validEntryPoints.push(srcPath);
        }
    }

    if (validEntryPoints.length === 0) {
        throw new Error('No valid entry points found in src directory');
    }

    return validEntryPoints;
}

// Function to verify icons
async function verifyIcons() {
    const iconDir = path.join('public', 'icons');
    const distIconDir = path.join('dist', 'icons');
    
    console.log('\nIcon Verification:');
    
    // Check public/icons
    try {
        const publicIcons = await fs.readdir(iconDir);
        console.log('public/icons contents:', publicIcons);
    } catch (error) {
        console.error('Error reading public/icons:', error.message);
    }
    
    // Check dist/icons
    try {
        const distIcons = await fs.readdir(distIconDir);
        console.log('dist/icons contents:', distIcons);
    } catch (error) {
        console.error('Error reading dist/icons:', error.message);
    }
}

// Function to copy public files to dist
async function copyPublicFiles() {
    try {
        await ensureDir('dist');
        await ensureDir('dist/icons');

        // Copy static files
        const files = ['manifest.json', 'popup.html', 'popup.css'];
        for (const file of files) {
            await copyFileIfExists(
                path.join('public', file),
                path.join('dist', file)
            );
        }

        // Copy icons with better error handling
        const iconDir = path.join('public', 'icons');
        const requiredIcons = ['icon16.png', 'icon48.png', 'icon128.png'];
        
        for (const iconFile of requiredIcons) {
            const sourcePath = path.join(iconDir, iconFile);
            const destPath = path.join('dist/icons', iconFile);
            
            try {
                await fs.access(sourcePath);
                await fs.copyFile(sourcePath, destPath);
                console.log(`Copied icon: ${iconFile}`);
                
                // Verify file size
                const stats = await fs.stat(destPath);
                console.log(`Icon ${iconFile} size: ${stats.size} bytes`);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.error(`Missing required icon: ${iconFile}`);
                    throw new Error(`Required icon ${iconFile} is missing from public/icons/`);
                }
                throw error;
            }
        }

        await verifyIcons();
        console.log('Files copied successfully!');
    } catch (error) {
        console.error('Error copying files:', error);
        throw error;
    }
}

async function build() {
    try {
        // Copy public files
        await copyPublicFiles();

        // Get valid entry points
        const entryPoints = await getValidEntryPoints();
        console.log('Building with entry points:', entryPoints);

        // Define environment variables for build
        const define = {
            'process.env.DEEPSEEK_API_KEY': JSON.stringify(process.env.DEEPSEEK_API_KEY),
            'process.env.API_URL': JSON.stringify(process.env.API_URL),
            'process.env.API_TIMEOUT': JSON.stringify(process.env.API_TIMEOUT),
            'process.env.DEBUG_MODE': JSON.stringify(process.env.DEBUG_MODE)
        };

        const buildOptions = {
            entryPoints,
            bundle: true,
            outdir: 'dist',
            format: 'esm',
            define,
            minify: !watch,
            target: ['chrome58', 'firefox57', 'safari11'],
            loader: { '.svg': 'text' },
            sourcemap: true,
            splitting: true,
            chunkNames: 'chunks/[name]-[hash]',
            external: ['chrome'],
            assetNames: 'assets/[name]-[hash]',
            metafile: true,
        };
        
        if (watch) {
            const context = await esbuild.context(buildOptions);
            await context.watch();
            console.log('Watching for changes...');
        } else {
            const result = await esbuild.build(buildOptions);
            console.log('Build complete!');
            
            if (result.metafile) {
                console.log('Output files:', Object.keys(result.metafile.outputs));
            }
        }
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build(); 