const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 400,
    backgroundColor: '#222',
    scene: { preload: preload, create: create }
};

const game = new Phaser.Game(config);
const GRID_SIZE = 8;
const TILE_SIZE = 50;
const COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];

let grid = [];
let selectedTile = null;
let isProcessing = false; // Prevents clicking while tiles are moving

function preload() {}

function create() {
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            spawnTile(x, y, this);
        }
    }
}

function spawnTile(x, y, scene) {
    let color = Phaser.Utils.Array.GetRandom(COLORS);
    let tile = scene.add.rectangle(x * TILE_SIZE + 25, y * TILE_SIZE + 25, 42, 42, color);
    tile.setInteractive();
    tile.setData('color', color);
    tile.setData('gridX', x);
    tile.setData('gridY', y);
    tile.on('pointerdown', () => handleSelect(tile, scene));
    grid[y][x] = tile;
}

async function handleSelect(tile, scene) {
    if (isProcessing) return;

    if (!selectedTile) {
        selectedTile = tile;
        tile.setStrokeStyle(3, 0xffffff);
    } else {
        let x1 = selectedTile.getData('gridX'), y1 = selectedTile.getData('gridY');
        let x2 = tile.getData('gridX'), y2 = tile.getData('gridY');

        if (Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1) {
            isProcessing = true;
            selectedTile.setStrokeStyle(0);
            await swapTiles(selectedTile, tile, scene);
            
            if (!checkMatches(scene)) {
                // If no match, swap back
                await swapTiles(selectedTile, tile, scene);
            }
            selectedTile = null;
            isProcessing = false;
        } else {
            selectedTile.setStrokeStyle(0);
            selectedTile = tile;
            tile.setStrokeStyle(3, 0xffffff);
        }
    }
}

function swapTiles(tile1, tile2, scene) {
    return new Promise(resolve => {
        const x1 = tile1.getData('gridX'), y1 = tile1.getData('gridY');
        const x2 = tile2.getData('gridX'), y2 = tile2.getData('gridY');

        // Update Grid Array
        grid[y1][x1] = tile2;
        grid[y2][x2] = tile1;

        // Update Data
        tile1.setData('gridX', x2); tile1.setData('gridY', y2);
        tile2.setData('gridX', x1); tile2.setData('gridY', y1);

        // Animate
        scene.tweens.add({
            targets: [tile1, tile2],
            x: (target) => target.getData('gridX') * TILE_SIZE + 25,
            y: (target) => target.getData('gridY') * TILE_SIZE + 25,
            duration: 200,
            onComplete: resolve
        });
    });
}

function checkMatches(scene) {
    let toDestroy = new Set();
    
    // Check Horizontal
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 2; x++) {
            let c1 = grid[y][x].getData('color'), c2 = grid[y][x+1].getData('color'), c3 = grid[y][x+2].getData('color');
            if (c1 === c2 && c2 === c3) {
                toDestroy.add(grid[y][x]); toDestroy.add(grid[y][x+1]); toDestroy.add(grid[y][x+2]);
            }
        }
    }
    // Check Vertical
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 2; y++) {
            let c1 = grid[y][x].getData('color'), c2 = grid[y+1][x].getData('color'), c3 = grid[y+2][x].getData('color');
            if (c1 === c2 && c2 === c3) {
                toDestroy.add(grid[y][x]); toDestroy.add(grid[y+1][x]); toDestroy.add(grid[y+2][x]);
            }
        }
    }

    if (toDestroy.size > 0) {
        toDestroy.forEach(t => t.destroy());
        // Note: Real Candy Crush would make tiles fall here. 
        // For now, they just disappear.
        return true;
    }
    return false;
}

