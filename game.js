const config = {
    type: Phaser.AUTO,
    width: 440,
    height: 550,
    backgroundColor: '#3d4a5d',
    scene: { preload: preload, create: create }
};

const game = new Phaser.Game(config);

const GRID_SIZE = 8;
const TILE_SIZE = 55;
const ANIMAL_FRAMES = [0, 1, 2, 3, 4, 5]; 

let grid = [];
let selectedTile = null;
let isProcessing = false;
let score = 0;
let scoreText;

function preload() {
    // Optimized for Kenney Animal Pack Redux
    this.load.spritesheet('animals', 'candy_sheet.png', {
        frameWidth: 136, 
        frameHeight: 136,
        margin: 0,
        spacing: 0
    });
}

function create() {
    scoreText = this.add.text(20, 490, 'SCORE: 0', { 
        fontSize: '28px', fill: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
    });

    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            spawnTile(x, y, this);
        }
    }
}

function spawnTile(x, y, scene) {
    let frame = Phaser.Utils.Array.GetRandom(ANIMAL_FRAMES);
    let tile = scene.add.sprite(x * TILE_SIZE + 35, y * TILE_SIZE + 35, 'animals', frame);
    
    tile.setScale(0.38); 
    tile.setInteractive();
    tile.setData('color', frame);
    tile.setData('gridX', x);
    tile.setData('gridY', y);
    
    tile.on('pointerdown', () => handleSelect(tile, scene));
    grid[y][x] = tile;
    return tile;
}

// --- MOVEMENT LOGIC ---
async function handleSelect(tile, scene) {
    if (isProcessing) return;

    if (!selectedTile) {
        selectedTile = tile;
        tile.setAlpha(0.6);
        tile.setScale(0.45);
    } else {
        let x1 = selectedTile.getData('gridX'), y1 = selectedTile.getData('gridY');
        let x2 = tile.getData('gridX'), y2 = tile.getData('gridY');

        if (Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1) {
            isProcessing = true;
            selectedTile.setAlpha(1);
            selectedTile.setScale(0.38);
            
            await swapTiles(selectedTile, tile, scene);
            
            if (checkMatches(scene)) {
                await processMatches(scene);
            } else {
                await swapTiles(selectedTile, tile, scene); // Back if no match
            }
            selectedTile = null;
            isProcessing = false;
        } else {
            selectedTile.setAlpha(1);
            selectedTile.setScale(0.38);
            selectedTile = tile;
            tile.setAlpha(0.6);
            tile.setScale(0.45);
        }
    }
}

function swapTiles(tile1, tile2, scene) {
    return new Promise(resolve => {
        const x1 = tile1.getData('gridX'), y1 = tile1.getData('gridY');
        const x2 = tile2.getData('gridX'), y2 = tile2.getData('gridY');

        grid[y1][x1] = tile2; grid[y2][x2] = tile1;
        tile1.setData('gridX', x2); tile1.setData('gridY', y2);
        tile2.setData('gridX', x1); tile2.setData('gridY', y1);

        scene.tweens.add({
            targets: [tile1, tile2],
            x: (t) => t.getData('gridX') * TILE_SIZE + 35,
            y: (t) => t.getData('gridY') * TILE_SIZE + 35,
            duration: 250,
            ease: 'Cubic.easeOut',
            onComplete: resolve
        });
    });
}

// --- MATCH & GRAVITY LOGIC ---
function checkMatches(scene) {
    let toDestroy = new Set();
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (x < GRID_SIZE - 2 && grid[y][x] && grid[y][x+1] && grid[y][x+2]) {
                if (grid[y][x].getData('color') === grid[y][x+1].getData('color') && 
                    grid[y][x].getData('color') === grid[y][x+2].getData('color')) {
                    toDestroy.add(grid[y][x]); toDestroy.add(grid[y][x+1]); toDestroy.add(grid[y][x+2]);
                }
            }
            if (y < GRID_SIZE - 2 && grid[y][x] && grid[y+1][x] && grid[y+2][x]) {
                if (grid[y][x].getData('color') === grid[y+1][x].getData('color') && 
                    grid[y][x].getData('color') === grid[y+2][x].getData('color')) {
                    toDestroy.add(grid[y][x]); toDestroy.add(grid[y+1][x]); toDestroy.add(grid[y+2][x]);
                }
            }
        }
    }

    if (toDestroy.size > 0) {
        score += toDestroy.size * 10;
        scoreText.setText('SCORE: ' + score);
        toDestroy.forEach(t => {
            grid[t.getData('gridY')][t.getData('gridX')] = null;
            scene.tweens.add({ 
                targets: t, 
                scale: 0, 
                angle: 180, 
                duration: 300, 
                onComplete: () => t.destroy() 
            });
        });
        return true;
    }
    return false;
}

async function processMatches(scene) {
    await new Promise(r => setTimeout(r, 350));
    
    // Gravity: Move tiles down
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
            if (grid[y][x] === null) {
                for (let k = y - 1; k >= 0; k--) {
                    if (grid[k][x]) {
                        grid[y][x] = grid[k][x];
                        grid[k][x] = null;
                        grid[y][x].setData('gridY', y);
                        scene.tweens.add({ 
                            targets: grid[y][x], 
                            y: y * TILE_SIZE + 35, 
                            duration: 400, 
                            ease: 'Bounce.easeOut' 
                        });
                        break;
                    }
                }
            }
        }
    }

    // Refill: Spawn new tiles
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (grid[y][x] === null) {
                let tile = spawnTile(x, y, scene);
                tile.y = -100; // Start higher up
                scene.tweens.add({ 
                    targets: tile, 
                    y: y * TILE_SIZE + 35, 
                    duration: 450, 
                    ease: 'Bounce.easeOut' 
                });
            }
        }
    }

    // Auto-check for combo matches after tiles settle
    await new Promise(r => setTimeout(r, 600));
    if (checkMatches(scene)) await processMatches(scene);
}

