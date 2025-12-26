const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 500, // Extra space for the score at the bottom
    backgroundColor: '#2c3e50',
    scene: { preload: preload, create: create }
};

const game = new Phaser.Game(config);

const GRID_SIZE = 8;
const TILE_SIZE = 50;
const CANDY_FRAMES = [0, 1, 2, 3, 4, 5]; // Different gem types in the sprite sheet

let grid = [];
let selectedTile = null;
let isProcessing = false;
let score = 0;
let scoreText;

function preload() {
    // Loading a colorful gem spritesheet (32x32 pixels per gem)
    this.load.spritesheet('candies', 'https://labs.phaser.io/assets/sprites/columns-gems.png', {
        frameWidth: 32,
        frameHeight: 32
    });
}

function create() {
    // Add Score Text
    scoreText = this.add.text(20, 430, 'SCORE: 0', { 
        fontSize: '28px', 
        fill: '#ffffff', 
        fontStyle: 'bold',
        fontFamily: 'Arial'
    });

    // Initialize Grid
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            spawnTile(x, y, this);
        }
    }
}

function spawnTile(x, y, scene) {
    let frame = Phaser.Utils.Array.GetRandom(CANDY_FRAMES);
    let tile = scene.add.sprite(x * TILE_SIZE + 25, y * TILE_SIZE + 25, 'candies', frame);
    
    tile.setScale(1.4); // Make them bigger and easier to click
    tile.setInteractive();
    tile.setData('color', frame);
    tile.setData('gridX', x);
    tile.setData('gridY', y);
    
    tile.on('pointerdown', () => handleSelect(tile, scene));
    grid[y][x] = tile;
    return tile;
}

async function handleSelect(tile, scene) {
    if (isProcessing) return;

    if (!selectedTile) {
        selectedTile = tile;
        tile.setAlpha(0.6); // Visual feedback for selection
        tile.setScale(1.6);
    } else {
        let x1 = selectedTile.getData('gridX'), y1 = selectedTile.getData('gridY');
        let x2 = tile.getData('gridX'), y2 = tile.getData('gridY');

        // Check if neighbor
        if (Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1) {
            isProcessing = true;
            selectedTile.setAlpha(1);
            selectedTile.setScale(1.4);
            
            await swapTiles(selectedTile, tile, scene);
            
            if (checkMatches(scene)) {
                await processMatches(scene);
            } else {
                // If no match, swap them back
                await swapTiles(selectedTile, tile, scene);
            }
            
            selectedTile = null;
            isProcessing = false;
        } else {
            // Deselect and select new one
            selectedTile.setAlpha(1);
            selectedTile.setScale(1.4);
            selectedTile = tile;
            tile.setAlpha(0.6);
            tile.setScale(1.6);
        }
    }
}

function swapTiles(tile1, tile2, scene) {
    return new Promise(resolve => {
        const x1 = tile1.getData('gridX'), y1 = tile1.getData('gridY');
        const x2 = tile2.getData('gridX'), y2 = tile2.getData('gridY');

        grid[y1][x1] = tile2;
        grid[y2][x2] = tile1;

        tile1.setData('gridX', x2); tile1.setData('gridY', y2);
        tile2.setData('gridX', x1); tile2.setData('gridY', y1);

        scene.tweens.add({
            targets: [tile1, tile2],
            x: (target) => target.getData('gridX') * TILE_SIZE + 25,
            y: (target) => target.getData('gridY') * TILE_SIZE + 25,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: resolve
        });
    });
}

function checkMatches(scene) {
    let toDestroy = new Set();
    
    // Check Horizontal
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 2; x++) {
            if (!grid[y][x] || !grid[y][x+1] || !grid[y][x+2]) continue;
            let c1 = grid[y][x].getData('color'), c2 = grid[y][x+1].getData('color'), c3 = grid[y][x+2].getData('color');
            if (c1 === c2 && c2 === c3) {
                toDestroy.add(grid[y][x]); toDestroy.add(grid[y][x+1]); toDestroy.add(grid[y][x+2]);
            }
        }
    }
    
    // Check Vertical
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 2; y++) {
            if (!grid[y][x] || !grid[y+1][x] || !grid[y+2][x]) continue;
            let c1 = grid[y][x].getData('color'), c2 = grid[y+1][x].getData('color'), c3 = grid[y+2][x].getData('color');
            if (c1 === c2 && c2 === c3) {
                toDestroy.add(grid[y][x]); toDestroy.add(grid[y+1][x]); toDestroy.add(grid[y+2][x]);
            }
        }
    }

    if (toDestroy.size > 0) {
        score += toDestroy.size * 10;
        scoreText.setText('SCORE: ' + score);
        toDestroy.forEach(t => {
            grid[t.getData('gridY')][t.getData('gridX')] = null;
            // Pop animation before destroying
            scene.tweens.add({
                targets: t,
                scale: 0,
                duration: 200,
                onComplete: () => t.destroy()
            });
        });
        return true;
    }
    return false;
}

async function processMatches(scene) {
    await new Promise(r => setTimeout(r, 250));

    // Gravity: Move tiles down
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
            if (grid[y][x] === null) {
                for (let k = y - 1; k >= 0; k--) {
                    if (grid[k][x] !== null) {
                        grid[y][x] = grid[k][x];
                        grid[k][x] = null;
                        grid[y][x].setData('gridY', y);
                        scene.tweens.add({
                            targets: grid[y][x],
                            y: y * TILE_SIZE + 25,
                            duration: 300,
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
                tile.y = -50;
                scene.tweens.add({
                    targets: tile,
                    y: y * TILE_SIZE + 25,
                    duration: 400,
                    ease: 'Bounce.easeOut'
                });
            }
        }
    }

    // Recursive check for combos
    await new Promise(r => setTimeout(r, 500));
    if (checkMatches(scene)) {
        await processMatches(scene);
    }
}

