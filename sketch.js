// sketch.js

// --- Global Game Variables ---
let player;
let enemies = [];
let projectiles = [];
let particles = [];
let powerUps = [];
let stars = []; // For parallax background

let score = 0;
let highScore = 0;
let gameState = STATE_START; // Initial game state

// Timers and Difficulty
let enemySpawnTimer = ENEMY_SPAWN_RATE_START;
let currentEnemySpawnRate = ENEMY_SPAWN_RATE_START;
let difficultyTimer = 0;

// UI Element Positions/Sizes
let pauseBtnX, pauseBtnY, pauseBtnSize;

// Store previous touch position for delta calculation in touchMoved
let prevTouchX = 0;
let prevTouchY = 0;

// Audio Context Status
let audioStarted = false;

// --- P5.js Core Functions ---

function setup() {
    createCanvas(windowWidth, windowHeight); // Use full window size
    frameRate(60); // Target 60 FPS
    angleMode(RADIANS); // Use radians for angles

    // Load high score from local storage
    let storedHighScore = localStorage.getItem('proceduralShooterHighScore');
    if (storedHighScore) highScore = parseInt(storedHighScore);

    // Initialize p5.sound components (does not start audio context yet)
    setupAudio();

    // Create the parallax starfield background
    createStarfield(3); // 3 layers

    // Calculate Pause Button position (top right)
    pauseBtnSize = PAUSE_BUTTON_SIZE; // From globals.js
    pauseBtnX = width - pauseBtnSize - PAUSE_BUTTON_PADDING; // From globals.js
    pauseBtnY = PAUSE_BUTTON_PADDING;

    // Add listeners to the canvas to prevent default browser touch actions (scrolling, zooming)
    let canvasElement = document.querySelector('canvas');
    if (canvasElement) {
        canvasElement.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
        canvasElement.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
        canvasElement.addEventListener('touchend', (e) => { e.preventDefault(); }, { passive: false });
    } else {
        console.warn("Could not find canvas element to attach touch listeners.");
    }

    // Define Key constants if not in globals.js
    // (Assuming p5's constants like UP_ARROW, ENTER, ESCAPE are used where available)
    // const KEY_W = 87; const KEY_A = 65; const KEY_S = 83; const KEY_D = 68;
    // const KEY_P = 80; const KEY_SPACE = 32; const KEY_SHIFT = 16;
}

// Adjust canvas and elements on window resize
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Recreate starfield for new dimensions
    createStarfield(3);
    // Recalculate pause button position
    pauseBtnX = width - pauseBtnSize - PAUSE_BUTTON_PADDING;
    pauseBtnY = PAUSE_BUTTON_PADDING;
    // Ensure player stays within bounds if resize happens mid-game
    if (player) {
        player.pos.x = constrain(player.pos.x, player.size / 2, width - player.size / 2);
        player.pos.y = constrain(player.pos.y, player.size / 2, height - player.size / 2);
    }
}

// Main P5 draw loop (runs continuously)
function draw() {
    background(0); // Clear screen each frame

    // Apply screen shake transformation if active
    push();
    applyScreenShake(); // From effects.js

    // Draw background elements
    drawStarfield(); // Draw parallax stars

    // --- Game State Machine ---
    // Executes logic and drawing based on the current gameState
    switch (gameState) {
        case STATE_START:
            drawStartMenu(); // Display title, instructions, start button
            break;
        case STATE_PLAYING:
            runGame(false); // Run game simulation and drawing
            drawHUD();      // Draw Heads-Up Display (score, lives, etc.)
            break;
        case STATE_PAUSED:
            runGame(true);  // Draw game elements without updating simulation
            drawHUD();      // Draw HUD even when paused
            drawPauseMenu();// Draw pause overlay and text
            break;
        case STATE_GAME_OVER:
            runGame(true);  // Draw the final frame of the game state
            drawGameOverMenu(); // Draw game over overlay, score, restart prompt
            break;
    }

    // Restore drawing matrix after potential screen shake
    pop();
}

// --- Game Simulation ---

// Runs the main game loop logic (updates and optionally drawing)
function runGame(isPaused = false) {

    // --- Update Logic (only run if not paused) ---
    if (!isPaused) {
        // Update Player (handles combined inputs)
        if (player) {
            player.update(touchInput); // Pass the current touch state
        } else {
            // Safety check: if player becomes null unexpectedly during play, trigger game over
            if (gameState === STATE_PLAYING) {
                console.error("Player became null unexpectedly during STATE_PLAYING!");
                gameOver();
            }
            return; // Stop processing this frame if player is null
        }

        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player); // Pass player for potential targeting
            if (enemies[i].isDead) enemies.splice(i, 1); // Remove dead enemies
        }

        // Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let offScreen = projectiles[i].update(); // Update position, check bounds
            if (offScreen || projectiles[i].isDead) { // Remove if off-screen or marked dead (e.g., railgun hit)
                projectiles.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update(); // Update position, lifespan
            if (particles[i].isDead) particles.splice(i, 1); // Remove dead particles
        }

        // Update PowerUps
        for (let i = powerUps.length - 1; i >= 0; i--) {
            powerUps[i].update(); // Update position, check bounds
            if (powerUps[i].isDead) powerUps.splice(i, 1); // Remove if off-screen
        }

        // Handle Spawning of new enemies
        handleEnemySpawning();

        // Perform Collision Detection
        handleCollisions(); // Checks player/projectiles vs enemies/powerups

        // Increase game difficulty over time
        increaseDifficulty();

        // Update status effects like score multiplier timer
        updateScoreMultiplier();

    } // End of if (!isPaused)

    // --- Drawing Logic (runs whether paused or not to show current/frozen state) ---
    // Draw PowerUps
    for (let p of powerUps) p.draw();
    // Draw Projectiles
    for (let p of projectiles) p.draw();
    // Draw Enemies
    for (let e of enemies) e.draw();
    // Draw Player (if exists)
    if (player) player.draw();
    // Draw Particles (on top)
    for (let p of particles) p.draw();
}

// --- Game State Management Functions ---

function startGame() {
    console.log("Starting Game...");
    score = 0; // Reset score
    // Clear all game entities
    enemies = []; projectiles = []; particles = []; powerUps = [];
    // Create a new player instance
    player = new Player(width / 2, height - 80); // Position near bottom center
    // Reset difficulty and spawning timers
    currentEnemySpawnRate = ENEMY_SPAWN_RATE_START;
    enemySpawnTimer = currentEnemySpawnRate;
    difficultyTimer = 0;
    // Reset status effects
    scoreMultiplierActive = false; scoreMultiplierEndTime = 0;

    // --- CRITICAL: Reset all input states ---
    touchInput = { isDown: false, startMillis: 0, currentX: 0, currentY: 0, moveDeltaX: 0, moveDeltaY: 0, isRailgunChargingTouch: false };
    keyboardState = { isChargingRailgun: false, isShootingKeyDown: false };
    // Reset previous touch position tracker
    prevTouchX = 0; prevTouchY = 0;
    // Reset player's internal movement flags just in case
    if (player) {
        player.isMoving = { up: false, down: false, left: false, right: false };
    }

    // Set game state to playing
    gameState = STATE_PLAYING;
    // Ensure the audio context is running (might have been suspended)
    startAudioContext();
}

function pauseGame() {
    if (gameState === STATE_PLAYING) {
        console.log("Pausing Game...");
        gameState = STATE_PAUSED;
        // If player was charging railgun when paused, stop the charge process cleanly
        if (player && player.isChargingRailgun) {
            player.stopRailgunCharge(); // Uses the unified stop function
        }
    } else if (gameState === STATE_PAUSED) {
        console.log("Resuming Game...");
        gameState = STATE_PLAYING;
        // Reset touch delta accumulation start point if touch is still held down during pause
        if (touchInput.isDown) {
            prevTouchX = touchInput.currentX; // Use last known position
            prevTouchY = touchInput.currentY;
            // Reset accumulated deltas to prevent jump on resume
            touchInput.moveDeltaX = 0;
            touchInput.moveDeltaY = 0;
        }
        // Ensure audio context resumes if it was suspended automatically by browser
        startAudioContext();
    }
}

function gameOver() {
    console.log("Game Over!");
    gameState = STATE_GAME_OVER; // Set state first

    // Update high score if current score is higher
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('proceduralShooterHighScore', highScore); // Save to local storage
    }

    // Stop any continuous sounds like railgun charge
    if (player && player.isChargingRailgun) {
        // Only need to stop the sound; state reset happens below and/or when player becomes null
        playAudio('stopRailgunCharge');
    }

    // --- CRITICAL: Reset all input states on game over ---
    touchInput = { isDown: false, startMillis: 0, currentX: 0, currentY: 0, moveDeltaX: 0, moveDeltaY: 0, isRailgunChargingTouch: false };
    keyboardState = { isChargingRailgun: false, isShootingKeyDown: false };
    prevTouchX = 0; prevTouchY = 0;


    // Create final explosion effect at player's position (if player exists)
    if (player) {
        createExplosion(player.pos.x, player.pos.y, 50, 40, 8); // Large explosion
        player = null; // Remove the player object
    }
}

// --- Spawning Logic ---

function handleEnemySpawning() {
    enemySpawnTimer--; // Decrement timer
    if (enemySpawnTimer <= 0) {
        spawnEnemy(); // Spawn a new enemy
        enemySpawnTimer = currentEnemySpawnRate; // Reset timer based on current difficulty rate
    }
}

function spawnEnemy() {
    let side = random(['top', 'left', 'right']); // Choose spawn edge
    let x, y;
    let buffer = 50; // Spawn slightly off-screen

    // Determine coordinates based on chosen side using current width/height
    if (side === 'top') {
        x = random(buffer, width - buffer);
        y = -buffer;
    } else if (side === 'left') {
        x = -buffer;
        y = random(buffer, height * 0.6); // Avoid spawning too low on sides
    } else { // Right side
        x = width + buffer;
        y = random(buffer, height * 0.6);
    }

    // Choose enemy type (example: random with difficulty bias)
    let enemyType = random([Drone, Weaver, Rusher, MiniCruiser]);
    // Simple bias example: more Drones early on
    if (score < 500 && random() < 0.6) enemyType = Drone;
    else if (score < 1500 && random() < 0.4) enemyType = random([Drone, Weaver]);
    else if (score < 3000 && random() < 0.3 && random() > 0.1) enemyType = Rusher; // Introduce Rushers slightly later

    enemies.push(new enemyType(x, y)); // Add the new enemy to the array
}

// Spawns a random power-up at a given location (usually called when an enemy dies)
function spawnPowerUp(x, y) {
    if (random() < POWERUP_SPAWN_CHANCE) { // Check against global spawn chance
        let type = random(['WEAPON', 'SHIELD', 'HEALTH', 'SCORE']); // Choose power-up type
        powerUps.push(new PowerUp(x, y, type)); // Add to power-ups array
    }
}

// Increases game difficulty periodically
function increaseDifficulty() {
    difficultyTimer++;
    if (difficultyTimer >= DIFFICULTY_INCREASE_INTERVAL) {
        difficultyTimer = 0; // Reset timer
        // Example: Decrease spawn interval (increase spawn rate), capped at minimum
        currentEnemySpawnRate = max(ENEMY_SPAWN_RATE_MIN, currentEnemySpawnRate * 0.95); // Gets faster over time
        console.log("Difficulty Increased! Spawn Rate:", currentEnemySpawnRate.toFixed(1));
        // Future: Could also increase enemy speed, health, firing rate, etc.
    }
}

// --- Collision Detection ---
// (Ensure this function remains robust against player becoming null mid-execution)
function handleCollisions() {
    // Top-level guard: If player is already null, exit immediately.
    if (!player) return;

    let playerColliderRadius = player.getCollider().radius; // Get radius once

    // 1. Player Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (!p || p.owner !== 'player') continue; // Check projectile exists and is player's

        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (!e || e.isDead) continue; // Check enemy exists and is alive

            let d = dist(p.pos.x, p.pos.y, e.pos.x, e.pos.y);
            if (d < e.size + p.size / 2) { // Simple circle collision check
                if (p.penetrating) { // Railgun logic
                    if (!p.hasHit(e)) {
                        e.takeDamage(p.damage); p.registerHit(e);
                        createExplosion(p.pos.x, p.pos.y, 5, 5, 1); // Small impact
                    }
                } else { // Normal projectile
                    e.takeDamage(p.damage);
                    createExplosion(p.pos.x, p.pos.y, 5, 5, 1);
                    projectiles.splice(i, 1); // Remove projectile
                    break; // Projectile is gone, move to next projectile
                }
            }
        }
        // Check again if player became null during enemy takeDamage loop (unlikely but safest)
        if (!player) return;
    }

    // --- POINT OF POTENTIAL PLAYER NULLIFICATION STARTS HERE ---
    if (!player) return; // Re-check player status

    // 2. Enemy Projectiles vs Player
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (!player) break; // Exit loop if player died mid-check
        let p = projectiles[i];
        if (!p || p.owner !== 'enemy') continue;

        let d = dist(p.pos.x, p.pos.y, player.pos.x, player.pos.y);
        if (d < playerColliderRadius + p.size / 2) {
            player.takeDamage(p.damage); // <<< CAN NULLIFY PLAYER
            createExplosion(p.pos.x, p.pos.y, 5, 5, 1); // Safe
            projectiles.splice(i, 1);
            // Break because player processes one hit per frame from this type
            break;
        }
    }

    if (!player) return; // Re-check player status

    // 3. Player vs Enemies (Collision)
    let vulnerableToCollision = !player.isInvincible && player.hitTimer <= 0;
    if (vulnerableToCollision) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (!player) break; // Exit loop if player died mid-check
            let e = enemies[j];
            if (!e || e.isDead) continue;

            let d = dist(player.pos.x, player.pos.y, e.pos.x, e.pos.y);
            if (d < playerColliderRadius + e.size * 0.8) { // Slightly tighter collision check
                player.takeDamage(1); // <<< CAN NULLIFY PLAYER
                // Safely calculate explosion position even if player just died
                let explosionX = player ? (player.pos.x + e.pos.x) / 2 : e.pos.x;
                let explosionY = player ? (player.pos.y + e.pos.y) / 2 : e.pos.y;
                // Check if enemy still exists before dealing damage back
                if (enemies[j]) e.takeDamage(5);
                createExplosion(explosionX, explosionY, 10, 15, 2);
                // Break because player processes one collision per frame
                break;
            }
        }
    }

    if (!player) return; // Re-check player status

    // 4. Player vs PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (!player) break; // Exit loop if player died mid-check
        let pu = powerUps[i];
        if (!pu) continue;

        let d = dist(player.pos.x, player.pos.y, pu.pos.x, pu.pos.y);
        if (d < playerColliderRadius + pu.size) {
            pu.applyEffect(player); // Apply power-up effect
            powerUps.splice(i, 1); // Remove collected power-up
            // No break, player can collect multiple powerups in one frame
        }
    }
}


// --- Drawing Menus and HUD ---

function drawStartMenu() {
    textAlign(CENTER, CENTER);
    // Title
    textSize(min(width * 0.08, 64)); fill(255); stroke(0); strokeWeight(2);
    text("PROCEDURAL SHOOTER", width / 2, height / 3);
    // Start Button/Area
    textSize(min(width * 0.05, 32)); fill(200); noStroke();
    let btnX = width / 2 - MENU_BUTTON_WIDTH / 2; let btnY = height / 2 - MENU_BUTTON_HEIGHT / 2;
    fill(50, 50, 80); rect(btnX, btnY, MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT, 10);
    fill(200); text("START", width / 2, height / 2); // Clearer text
    // High Score
    textSize(min(width * 0.04, 24)); fill(180);
    text(`High Score: ${highScore}`, width / 2, height * 0.65);
    // Instructions
    textSize(min(width * 0.03, 16)); fill(150);
    text("PC: WASD/Arrows + Space | P/Esc=Pause | Enter=Start", width / 2, height * 0.80); // Adjusted Y
    text("Mobile: Drag to Move | Tap Top-Right=Pause | Tap 'Start'", width / 2, height * 0.80 + 25);
}

function drawPauseMenu() {
    fill(0, 0, 0, 180); rect(0, 0, width, height); // Overlay
    textAlign(CENTER, CENTER); noStroke();
    textSize(min(width * 0.1, 48)); fill(255); text("PAUSED", width / 2, height * 0.4); // Adjusted Y
    textSize(min(width * 0.05, 24)); fill(200);
    text("PC: Press P/Esc to Resume", width / 2, height * 0.6);
    text("Mobile: Tap Screen or Pause Button", width / 2, height * 0.6 + 30);
}

function drawGameOverMenu() {
    fill(0, 0, 0, 200); rect(0, 0, width, height); // Overlay
    textAlign(CENTER, CENTER); noStroke();
    // Title
    textSize(min(width * 0.1, 64)); fill(255, 50, 50); text("GAME OVER", width / 2, height / 3);
    // Scores
    textSize(min(width * 0.06, 32)); fill(255); text(`Final Score: ${score}`, width / 2, height * 0.50); // Adjusted Y
    textSize(min(width * 0.04, 24)); fill(180); text(`High Score: ${highScore}`, width / 2, height * 0.50 + 50);
    // Restart Button/Area
    textSize(min(width * 0.05, 28));
    let btnX = width / 2 - MENU_BUTTON_WIDTH / 2; let btnY = height * 0.7 - MENU_BUTTON_HEIGHT / 2;
    fill(50, 80, 50); rect(btnX, btnY, MENU_BUTTON_WIDTH, MENU_BUTTON_HEIGHT, 10);
    fill(200); text("RESTART", width / 2, height * 0.7); // Clearer text
    // Instructions
    textSize(min(width * 0.03, 16)); fill(150);
    text("PC: Press Enter | Mobile: Tap Button", width / 2, height * 0.7 + 50);
}

function drawHUD() {
    push(); resetMatrix(); // Isolate HUD drawing from game transformations

    // --- Pause Button ---
    fill(COLOR_PAUSE_BUTTON); noStroke();
    rect(pauseBtnX, pauseBtnY, pauseBtnSize, pauseBtnSize, 5);
    let barW = pauseBtnSize * 0.2; let barH = pauseBtnSize * 0.5;
    let barX1 = pauseBtnX + pauseBtnSize * 0.3 - barW / 2;
    let barX2 = pauseBtnX + pauseBtnSize * 0.7 - barW / 2;
    let barY = pauseBtnY + pauseBtnSize * 0.25;
    fill(255); rect(barX1, barY, barW, barH); rect(barX2, barY, barW, barH);

    // --- Text Info ---
    textSize(min(max(width * 0.03, 14), 20)); fill(COLOR_HUD[0], COLOR_HUD[1], COLOR_HUD[2]); noStroke();
    // Score (Top Left)
    textAlign(LEFT, TOP); text(`Score: ${score}`, 10, 10);
    // High Score (Below Pause Button)
    textAlign(RIGHT, TOP); text(`High: ${highScore}`, width - PAUSE_BUTTON_PADDING, PAUSE_BUTTON_PADDING + PAUSE_BUTTON_SIZE + 5);
    // Lives (Below Score)
    textAlign(LEFT, TOP); text("Lives: ", 10, 40);
    let lifeIconSize = 15; let livesToShow = player ? player.lives : 0;
    for (let i = 0; i < livesToShow; i++) {
        drawPlayerLifeIcon(70 + i * (lifeIconSize + 5), 40 + lifeIconSize * 0.5, lifeIconSize);
    }
    // Weapon and Status (Below Lives)
    if (player) {
        textAlign(LEFT, TOP); let weaponText = `Weapon: ${player.currentWeapon}`;
        if (scoreMultiplierActive) weaponText += " (Score x2!)";
        text(weaponText, 10, 70);
        // Shield Bar
        if (player.isInvincible && player.shieldTimer > 0) {
            let barWidth = 100; let barHeight = 10; let barYPos = 100;
            let currentWidth = map(player.shieldTimer, 0, POWERUP_DURATION, 0, barWidth);
            fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], 100); rect(10, barYPos, barWidth, barHeight);
            fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], 200); rect(10, barYPos, currentWidth, barHeight);
            fill(255); textSize(12); textAlign(LEFT, CENTER); text("Shield", 15 + barWidth, barYPos + barHeight/2);
        }
    }
    pop(); // Restore drawing state
}

// Helper to draw a mini player icon for lives
function drawPlayerLifeIcon(x, y, size) {
    push(); translate(x, y); scale(size / 20); // Assumes base size 20
    strokeWeight(max(1, 1.5 / (size / 20))); // Scale stroke weight, ensure min 1
    stroke(200, 230, 255); fill(COLOR_PLAYER[0], COLOR_PLAYER[1], COLOR_PLAYER[2]);
    beginShape(); vertex(0, -10); vertex(-7, 7); vertex(7, 7); endShape(CLOSE);
    fill(50, 80, 120); noStroke(); ellipse(0, -1, 5, 8); // Simplified cockpit
    pop();
}

// --- Parallax Background ---
function createStarfield(layers = 3) { /* ... as before, uses width/height ... */
    stars = [];
    for (let i = 0; i < layers; i++) {
        let layerStars = [];
        let numStars = round(max(50, (width * height) / (800 * 600) * (100 * (i + 1))));
        let speed = 0.5 + i * 0.8; let starSize = 1 + i * 0.5;
        for (let j = 0; j < numStars; j++) {
            layerStars.push({ x: random(width), y: random(height), speed: speed, size: random(0.5, starSize), colorVal: random(100, 200) });
        } stars.push(layerStars);
    }
}
function drawStarfield() { /* ... as before, uses width/height ... */
    noStroke();
    for (let layer of stars) {
        for (let star of layer) {
            star.y += star.speed;
            if (star.y > height) { star.y = random(-10, 0); star.x = random(width); }
            fill(star.colorVal); ellipse(star.x, star.y, star.size, star.size);
        }
    }
}

// --- Input Handling (Combined Keyboard and Touch) ---

function keyPressed() {
    if (!audioStarted) startAudioContext(); // Start audio on first interaction

    // Menu Navigation (Enter)
    if ((gameState === STATE_START || gameState === STATE_GAME_OVER) && keyCode === ENTER) {
        startGame(); return; // Consume event
    }
    // Pause Toggle (P or Escape)
    if ((keyCode === KEY_P || keyCode === ESCAPE)) { // Assuming KEY_P is defined
        if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
            pauseGame(); return; // Consume event
        }
    }
    // Gameplay Controls (pass to player)
    if (gameState === STATE_PLAYING && player) {
        player.handleKeyboardInput(keyCode, true);
    }
    // Prevent default browser behavior for keys like Spacebar scrolling
    if (keyCode === KEY_SPACE) return false;
}

function keyReleased() {
    // Gameplay Controls (pass to player)
    if (gameState === STATE_PLAYING && player) {
        player.handleKeyboardInput(keyCode, false);
    }
}

function touchStarted() {
    if (!audioStarted) startAudioContext(); // Start audio on first interaction

    let touchX = mouseX; let touchY = mouseY; // Use p5's mapping for first touch

    // --- 1. Check UI Buttons First ---
    // Pause Button (only active during play/pause)
    if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
        if (touchX > pauseBtnX && touchX < pauseBtnX + pauseBtnSize && touchY > pauseBtnY && touchY < pauseBtnY + pauseBtnSize) {
            pauseGame(); return false; // Consume touch
        }
    }
    // Start Button (only active in start menu)
    if (gameState === STATE_START) {
        let btnX = width / 2 - MENU_BUTTON_WIDTH / 2; let btnY = height / 2 - MENU_BUTTON_HEIGHT / 2;
        if (touchX > btnX && touchX < btnX + MENU_BUTTON_WIDTH && touchY > btnY && touchY < btnY + MENU_BUTTON_HEIGHT) {
            startGame(); return false; // Consume touch
        }
    }
    // Restart Button (only active on game over)
    if (gameState === STATE_GAME_OVER) {
        let btnX = width / 2 - MENU_BUTTON_WIDTH / 2; let btnY = height * 0.7 - MENU_BUTTON_HEIGHT / 2;
        if (touchX > btnX && touchX < btnX + MENU_BUTTON_WIDTH && touchY > btnY && touchY < btnY + MENU_BUTTON_HEIGHT) {
            startGame(); return false; // Consume touch
        }
    }
    // Tap anywhere else to unpause (if paused and not hitting pause button)
    if (gameState === STATE_PAUSED) {
        pauseGame(); return false; // Consume touch
    }

    // --- 2. Handle Gameplay Input ---
    // Start movement/shooting only if playing and no touch is currently active
    if (gameState === STATE_PLAYING && !touchInput.isDown) {
        touchInput.isDown = true;
        touchInput.currentX = touchX; touchInput.currentY = touchY;
        prevTouchX = touchX; prevTouchY = touchY; // Initialize prev pos for delta calc
        touchInput.moveDeltaX = 0; touchInput.moveDeltaY = 0; // Reset deltas

        // Attempt to start Railgun charge via Touch
        // Check if player exists, weapon is railgun, not already charging from ANY source, and cooldown ready
        if (player && player.currentWeapon === WEAPON_RAILGUN && !player.isChargingRailgun && player.shootCooldown <= 0) {
            touchInput.isRailgunChargingTouch = true; // Mark touch as the source
            player.isChargingRailgun = true;        // Set unified player state
            player.railgunCharge = 0;               // Reset charge amount
            playAudio('startRailgunCharge');        // Play sound
        } else {
            touchInput.isRailgunChargingTouch = false; // Ensure flag is false if not charging via touch
        }
    }
    // Always prevent default for touch start if not consumed by UI
    return false;
}

function touchMoved() {
    // Update touch position and calculate delta if a touch is active during gameplay
    if (gameState === STATE_PLAYING && touchInput.isDown) {
        let touchX = mouseX; let touchY = mouseY;
        let dx = touchX - prevTouchX; let dy = touchY - prevTouchY; // Delta since last move event
        // Accumulate deltas (player.update will use and reset these)
        touchInput.moveDeltaX += dx; touchInput.moveDeltaY += dy;
        // Update current and previous positions
        touchInput.currentX = touchX; touchInput.currentY = touchY;
        prevTouchX = touchX; prevTouchY = touchY;
    }
    // Prevent default browser scrolling behavior
    return false;
}

function touchEnded() {
    // Process touch end only if a touch was active (touchInput.isDown is true)
    if (touchInput.isDown) {
        // If playing and this specific touch was charging the railgun, fire it
        if (gameState === STATE_PLAYING && touchInput.isRailgunChargingTouch && player) {
            player.fireRailgun('touch'); // Fire railgun, resets states internally
        }
        // Ensure touch-specific charging flag is reset even if not playing/player died
        touchInput.isRailgunChargingTouch = false;

        // Reset general touch state flags
        touchInput.isDown = false;
        touchInput.moveDeltaX = 0; // Reset accumulated deltas on release
        touchInput.moveDeltaY = 0;
        // Reset prevTouch position trackers? Optional, might prevent jumps if new touch starts instantly.
        // prevTouchX = 0; prevTouchY = 0;
    }
    // Prevent default browser actions (like zoom on double tap)
    return false;
}


// --- Audio Context Helper ---
function startAudioContext() { /* ... as before ... */
    if (getAudioContext() && getAudioContext().state !== 'running') {
        getAudioContext().resume().then(() => {
            console.log("Audio Context Resumed"); audioStarted = true;
            if (typeof lastMusicNoteTime !== 'undefined') lastMusicNoteTime = millis(); // Reset music timer if exists
        }).catch(e => { console.error("Audio Context resume failed:", e); audioStarted = false; });
    } else if (getAudioContext() && getAudioContext().state === 'running') { audioStarted = true; }
    else { console.error("Audio context not available."); audioStarted = false; }
}

/*
// --- Score Multiplier Global Functions ---
let scoreMultiplierActive = false; let scoreMultiplierEndTime = 0;
function activateScoreMultiplier(duration) { /!* ... as before ... *!/
    scoreMultiplierActive = true; scoreMultiplierEndTime = millis() + duration * (1000.0 / 60.0); }
function updateScoreMultiplier() { /!* ... as before ... *!/
    if (scoreMultiplierActive && millis() > scoreMultiplierEndTime) scoreMultiplierActive = false; }
function getScoreMultiplier() { /!* ... as before ... *!/ return scoreMultiplierActive ? 2 : 1; }*/
