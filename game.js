const config = {
    type: Phaser.AUTO,
    width: 600,  // Increased width
    height: 800, // Increased height
    backgroundColor: '#2c3e50',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

const GRID_SIZE = 8;
const TILE_SIZE = 70; // Larger tiles
const ANIMAL_FRAMES = [0, 1, 2, 3, 4, 5]; 

let grid = [];
let selectedTile = null;
let isProcessing = false;
let score = 0;
let timeLeft = 60;
let gameMode = 'rush'; // 'rush' or 'endless'
let gameActive = false;
let lastMoveTime = 0;
let hintTween = null;

// UI Elements
let scoreText, timerText, menuPanel, titleText, modeText;

function preload() {
    this.load.spritesheet('animals', 'candy_sheet.png', { frameWidth: 136, frameHeight: 136 });
}

function create() {
    scoreText = this.add.text(20, 720, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    timerText = this.add.text(400, 720, 'Time: 60', { fontSize: '32px', fill: '#fff' });
    
    createGrid(this);
    createMenu(this);
    lastMoveTime = this.time.now;
}

function createMenu(scene) {
    menuPanel = scene.add.container(300, 400).setDepth(100);
    let bg = scene.add.rectangle(0, 0, 500, 600, 0x000000, 0.9).setInteractive();
    titleText = scene.add.text(0, -200, 'ANIMAL MATCH', { fontSize: '48px', fill: '#ff0' }).setOrigin(0.5);
    
    let btnRush = createButton(scene, 0, -50, '1 MIN RUSH', () => startNewGame(scene, 'rush'));
    let btnEndless = createButton(scene, 0, 50, 'ENDLESS MODE', () => startNewGame(scene, 'endless'));
    
    menuPanel.add([bg, titleText, btnRush, btnEndless]);
}

function createButton(scene, x, y, label, callback) {
    let btn = scene.add.text(x, y, label, { fontSize: '32px', backgroundColor: '#e74c3c', padding: 15 })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', callback);
    return btn;
}

function startNewGame(scene, mode) {
    gameMode = mode;
    score = 0;
    timeLeft = 60;
    gameActive = true;
    menuPanel.setVisible(false);
    lastMoveTime = scene.time.now;

    if (mode === 'rush') {
        spawnColorBomb(scene); // OG Color Bomb at start
    }
}

function spawnColorBomb(scene) {
    let rx = Phaser.Math.Between(0, 7);
    let ry = Phaser.Math.Between(0, 7);
    if (grid[ry][rx]) {
        grid[ry][rx].setData('isBigBomb', true);
        grid[ry][rx].setTint(0x000000); // Black Ball appearance
        scene.tweens.add({ targets: grid[ry][rx], scale: 0.6, yoyo: true, repeat: -1 });
    }
}

async function handleSelect(tile, scene) {
    if (isProcessing || !gameActive) return;
    clearHint();
    lastMoveTime = scene.time.now;

    if (!selectedTile) {
        selectedTile = tile;
        tile.setScale(0.6);
    } else {
        if (Phaser.Math.Distance.Between(selectedTile.x, selectedTile.y, tile.x, tile.y) <= TILE_SIZE + 5) {
            isProcessing = true;
            
            // Check for Color Bomb Logic
            if (selectedTile.getData('isBigBomb') || tile.getData('isBigBomb')) {
                let colorToClear = selectedTile.getData('isBigBomb') ? tile.getData('color') : selectedTile.getData('color');
                await explodeColor(scene, colorToClear);
                selectedTile.destroy(); tile.destroy();
            } else {
                await swapTiles(selectedTile, tile, scene);
                if (checkMatches(scene)) {
                    await processMatches(scene);
                } else {
                    await swapTiles(selectedTile, tile, scene);
                }
            }
            selectedTile = null;
            isProcessing = false;
        } else {
            selectedTile.setScale(0.5);
            selectedTile = tile;
            tile.setScale(0.6);
        }
    }
}

async function explodeColor(scene, color) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] && grid[y][x].getData('color') === color) {
                scene.tweens.add({ targets: grid[y][x], scale: 0, duration: 200 });
                grid[y][x] = null;
            }
        }
    }
    await processMatches(scene);
}

function update(time) {
    if (gameActive && time - lastMoveTime > 5000) {
        showHint(this);
        lastMoveTime = time; // Reset hint timer
    }
}

function showHint(scene) {
    // Logic to find first possible match
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x]) {
                hintTween = scene.tweens.add({
                    targets: grid[y][x],
                    alpha: 0.5,
                    yoyo: true,
                    repeat: 2,
                    duration: 300
                });
                return; 
            }
        }
    }
}

function clearHint() {
    if (hintTween) {
        hintTween.stop();
        hintTween = null;
    }
}

// ... spawnTile, swapTiles, createGrid from previous codes ...
// checkMatches modified to return "4" or "5" for bombs

