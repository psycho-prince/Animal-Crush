const config = {
    type: Phaser.AUTO,
    width: window.innerWidth, 
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

const GRID_SIZE = 10;
let TILE_SIZE = Math.floor(window.innerWidth / 11); 
const ANIMAL_FRAMES = [0, 1, 2, 3, 4, 5]; 

let grid = [];
let selectedTile = null;
let isProcessing = false;
let score = 0;
let timeLeft = 60;
let gameActive = false;
let lastMoveTime = 0;

function preload() {
    this.load.spritesheet('animals', 'candy_sheet.png', { frameWidth: 136, frameHeight: 136 });
    
    // FETCHING SOUNDS: Using free public assets for immediate play
    this.load.audio('pop', 'https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    this.load.audio('bomb', 'https://actions.google.com/sounds/v1/science_fiction/stinger_ray_gun.ogg');
}

function create() {
    let style = { fontSize: '32px', fill: '#00ffcc', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 };
    this.scoreText = this.add.text(20, 40, 'SCORE: 0', style).setDepth(20);
    this.timerText = this.add.text(window.innerWidth - 180, 40, '60s', style).setDepth(20);

    createGrid(this);
    createMenu(this);
}

function createMenu(scene) {
    scene.menuGroup = scene.add.container(0, 0).setDepth(100);
    let bg = scene.add.rectangle(config.width/2, config.height/2, config.width, config.height, 0x000000, 0.8);
    let title = scene.add.text(config.width/2, config.height/3, 'ANIMAL POP!', { fontSize: '70px', fill: '#ff0066', fontStyle: 'bold' }).setOrigin(0.5);
    
    let startBtn = scene.add.text(config.width/2, config.height/2, 'START GAME', { fontSize: '40px', backgroundColor: '#00ffcc', color: '#000', padding: 25 })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            scene.menuGroup.setVisible(false);
            gameActive = true;
            lastMoveTime = scene.time.now;
            spawnColorBomb(scene); 
        });

    scene.menuGroup.add([bg, title, startBtn]);
}

function spawnColorBomb(scene) {
    let x = Phaser.Math.Between(0, 9);
    let y = Phaser.Math.Between(0, 9);
    if (grid[y][x]) {
        let bomb = grid[y][x];
        bomb.setData('special', 'colorBomb');
        bomb.setTint(0x333333); // Black ball appearance
        scene.tweens.add({ targets: bomb, scale: 0.5, angle: 360, duration: 1500, repeat: -1 });
    }
}

function spawnTile(x, y, scene) {
    let frame = Phaser.Utils.Array.GetRandom(ANIMAL_FRAMES);
    let tile = scene.add.sprite(x * TILE_SIZE + (TILE_SIZE), y * TILE_SIZE + 200, 'animals', frame);
    tile.setScale((TILE_SIZE / 136) * 0.9);
    tile.setInteractive();
    tile.setData({ color: frame, gridX: x, gridY: y });
    tile.on('pointerdown', () => { if(gameActive) handleSelect(tile, scene); });
    grid[y][x] = tile;
    return tile;
}

function createGrid(scene) {
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            spawnTile(x, y, scene);
        }
    }
}

async function handleSelect(tile, scene) {
    if (isProcessing) return;
    lastMoveTime = scene.time.now;

    if (!selectedTile) {
        selectedTile = tile;
        tile.setAlpha(0.5);
    } else {
        let x1 = selectedTile.getData('gridX'), y1 = selectedTile.getData('gridY');
        let x2 = tile.getData('gridX'), y2 = tile.getData('gridY');

        if (Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1) {
            isProcessing = true;
            selectedTile.setAlpha(1);
            
            if (selectedTile.getData('special') === 'colorBomb' || tile.getData('special') === 'colorBomb') {
                scene.sound.play('bomb');
                let color = (selectedTile.getData('special') === 'colorBomb') ? tile.getData('color') : selectedTile.getData('color');
                await explodeColor(scene, color);
                if (selectedTile.getData('special') === 'colorBomb') selectedTile.destroy(); else tile.destroy();
            } else {
                await swapTiles(selectedTile, tile, scene);
                if (checkMatches(scene)) {
                    scene.sound.play('pop');
                    await processMatches(scene);
                } else {
                    await swapTiles(selectedTile, tile, scene);
                }
            }
            selectedTile = null;
            isProcessing = false;
        } else {
            selectedTile.setAlpha(1);
            selectedTile = tile;
            tile.setAlpha(0.5);
        }
    }
}

async function explodeColor(scene, color) {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] && grid[y][x].getData('color') === color) {
                grid[y][x].destroy();
                grid[y][x] = null;
            }
        }
    }
    await processMatches(scene);
}

// Logic for swapTiles, checkMatches, and processMatches remain from previous versions
// Ensure you have copied those full functions into your script as well.

function update(time) {
    if (gameActive && time - lastMoveTime > 4000) {
        // COOL HINT: Animal shakes to get attention
        let t = grid[Phaser.Math.Between(0,9)][Phaser.Math.Between(0,9)];
        if (t) {
            this.tweens.add({ targets: t, x: t.x + 5, yoyo: true, repeat: 5, duration: 50 });
            lastMoveTime = time;
        }
    }
}

