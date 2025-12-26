🐾 Animal Pop
A vibrant, mobile-friendly Match-3 puzzle game built with Phaser 3. Swap cute animals to create matches, score points, and beat the clock!
🎮 Game Modes
 * 1 Min Rush: A high-intensity mode where you have 60 seconds to get the highest score possible.
 * Endless Mode: Relaxed gameplay with no timer—perfect for casual play.
✨ Features
 * Mobile-First Design: Responsive grid scaling that fits perfectly on phone and tablet screens.
 * Smooth Animations: Physics-based sliding and "Bounce" gravity effects for a satisfying feel.
 * Clean UI: * Top HUD for Score and Timer.
   * Dedicated Quit to Menu button at the bottom, placed away from the play area to prevent accidental taps.
 * Smart Hints: If you get stuck, a random tile will shake to give you a hint.
🛠️ Tech Stack
 * Framework: Phaser 3
 * Language: JavaScript (ES6)
 * Assets: Custom spritesheet for animals and cartoon audio effects.
🚀 How to Run
 * Clone the repo:
   git clone https://github.com/psycho-prince/Candy-Crush

 * Asset Setup: Ensure you have your candy_sheet.png (the animal spritesheet) in the root folder.
 * Local Server:
   Because Phaser loads assets via XHR, you need a local web server to run the game. You can use:
   * VS Code: Live Server Extension
   * Python: python -m http.server
   * Node.js: npx serve
🕹️ Controls
 * Touch/Click: Tap an animal to select it (it will become semi-transparent).
 * Swap: Tap a neighboring animal (up, down, left, or right) to swap positions.
 * Match: Align 3 or more of the same animal to clear them and score 10 points per animal.
📜 License
This project is open-source and available under the MIT License.
