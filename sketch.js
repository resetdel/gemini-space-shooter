// sketch.js

let player;
let enemies = [];
let projectiles = [];
let particles = [];
let powerUps = [];
let stars = []; // For parallax background

let score = 0;
let highScore = 0;
let gameState = STATE_START;

let enemySpawnTimer = ENEMY_SPAWN_RATE_START;
let currentEnemySpawnRate = ENEMY_SPAWN_RATE_START;
let difficultyTimer = 0;

// --- P5.js Core Functions ---

function setup() {
    createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
    frameRate(60);
    angleMode(RADIANS); // Important for vector math

    // Load high score from local storage (optional)
    let storedHighScore = localStorage.getItem('proceduralShooterHighScore');
    if (storedHighScore) {
        highScore = parseInt(storedHighScore);
    }

    // Audio Setup (Needs to be called here)
    setupAudio();

    // Initialize background stars
    createStarfield(3); // 3 layers
}
/*
function draw() {
    background(0); // Clear screen

    // Apply screen shake effect globally
    push();
    applyScreenShake();

    // Draw background first
    drawStarfield();


    // --- Game State Machine ---
    switch (gameState) {
        case STATE_START:
            drawStartMenu();
            break;
        case STATE_PLAYING:
            runGame();
            break;
        case STATE_PAUSED:
            runGame(true); // Run game logic but draw pause overlay
            drawPauseMenu();
            break;
        case STATE_GAME_OVER:
            runGame(true); // Still draw the game state at the end moment? Optional.
            drawGameOverMenu();
            break;
    }

    // Restore transform matrix after screen shake
    pop();

    // Update and draw HUD on top of everything (except maybe pause/gameover)
    if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
        drawHUD();
    }
    if (gameState === STATE_PLAYING) {
        updateScoreMultiplier(); // Check if score multiplier expires
    }


    // Manage Audio Context start (needs user gesture)
    // This is implicitly handled now by the start game click
}*/

// --- Game Logic Functions ---

function runGame(isPaused = false) {

    if (!isPaused) {
        // --- Updates ---
        // Ensure player exists before updating - though in PLAYING state it should.
        if (player) {
            player.update();
        } else {
            // This case should ideally not happen in STATE_PLAYING
            // If it does, maybe force game over?
            console.error("Player is null during active gameplay!");
            if (gameState === STATE_PLAYING) gameOver();
            return; // Stop further processing for this frame if player vanished
        }


        // Update Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(player); // Pass player for targeting
            if (enemies[i].isDead) {
                enemies.splice(i, 1);
            }
        }

        // Update Projectiles
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let offScreen = projectiles[i].update();
            if (offScreen || projectiles[i].isDead) {
                projectiles.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            if (particles[i].isDead) {
                particles.splice(i, 1);
            }
        }

        // Update PowerUps
        for (let i = powerUps.length - 1; i >= 0; i--) {
            powerUps[i].update();
            if (powerUps[i].isDead) {
                powerUps.splice(i, 1);
            }
        }

        // --- Spawning ---
        handleEnemySpawning();

        // --- Collisions ---
        // Only run collisions if the game is actively playing (and player exists)
        handleCollisions(); // Player existence is checked within handleCollisions now

        // --- Difficulty Scaling ---
        increaseDifficulty();

        // --- Background Music ---
        // playAudio('musicTick');
    } // End of if (!isPaused)


    // --- Drawing (Always happens in PLAYING or PAUSED state, or frozen in GAME_OVER) ---
    // Background is drawn in main draw loop

    // Draw PowerUps
    for (let p of powerUps) {
        p.draw();
    }

    // Draw Projectiles
    for (let p of projectiles) {
        p.draw();
    }

    // Draw Enemies
    for (let e of enemies) {
        e.draw();
    }

    // Draw Player - Check if player exists before drawing
    if (player) {
        player.draw();
    }

    // Draw Particles
    for (let p of particles) {
        p.draw();
    }
}

// ... (keep startGame, pauseGame, gameOver functions) ...

// MODIFY handleCollisions to add top-level player check
function handleCollisions() {
    // Top-level guard: If player is already null when starting, exit.
    if (!player) {
        return;
    }

    // Assign collider ONLY if player exists (already guaranteed by guard above)
    // We'll use player.pos directly later for distance, but keep radius.
    let playerColliderRadius = player.getCollider().radius; // Get radius once

    // 1. Player Projectiles vs Enemies (Safe regarding 'player' nullification itself)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (p.owner !== 'player') continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (e.isDead) continue;

            let d = dist(p.pos.x, p.pos.y, e.pos.x, e.pos.y);

            if (d < e.size + p.size / 2) {
                if (p.penetrating) {
                    if (!p.hasHit(e)) {
                        e.takeDamage(p.damage); // Doesn't null player
                        p.registerHit(e);
                        createExplosion(p.pos.x, p.pos.y, 5, 5, 1);
                    }
                } else {
                    e.takeDamage(p.damage); // Doesn't null player
                    createExplosion(p.pos.x, p.pos.y, 5, 5, 1);
                    projectiles.splice(i, 1);
                    break; // Projectile gone, check next projectile
                }
            }
        }
        // Ensure projectile still exists if penetrating before next check
        if (!projectiles[i] && i < projectiles.length) continue;
    }

    // --- POINT OF POTENTIAL NULLIFICATION STARTS HERE ---

    // Re-check player status before proceeding to checks that CAN null the player
    if (!player) return; // Exit if player became null (highly unlikely here, but safest)

    // 2. Enemy Projectiles vs Player
    for (let i = projectiles.length - 1; i >= 0; i--) {
        // Check player status *inside* the loop before using it
        if (!player) break; // Stop checking projectiles vs player if player died

        let p = projectiles[i];
        if (p.owner !== 'enemy' || !p) continue; // Check projectile exists too

        let d = dist(p.pos.x, p.pos.y, player.pos.x, player.pos.y); // Use current player.pos
        if (d < playerColliderRadius + p.size / 2) {
            player.takeDamage(p.damage); // <<<< CAN NULL 'player'
            // No need to check !player immediately after, loop condition handles it.
            createExplosion(p.pos.x, p.pos.y, 5, 5, 1);
            projectiles.splice(i, 1);
            // Break inner loop as player was hit by *a* projectile, but continue outer loop if player survived.
            // Actually, let's break outer loop too, player processes one hit per frame from this section
            break; // Exit projectile vs player checks for this frame
        }
    }

    // Re-check player status *again* before enemy vs player collision
    if (!player) return;

    // 3. Player vs Enemies (Collision Damage)
    let vulnerableToCollision = !player.isInvincible && player.hitTimer <= 0;
    if (vulnerableToCollision) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            // Check player status inside the loop
            if (!player) break; // Stop checking enemy collisions if player died

            let e = enemies[j];
            if (e.isDead || !e) continue; // Check enemy exists

            let d = dist(player.pos.x, player.pos.y, e.pos.x, e.pos.y); // Use current player.pos
            if (d < playerColliderRadius + e.size * 0.8) {
                player.takeDamage(1); // <<<< CAN NULL 'player'
                // Check if enemy still exists after player potentially exploded near it? Less critical.
                if (enemies[j]) { // Check if enemy still exists
                    e.takeDamage(5);
                }
                // Use player.pos for explosion center as playerCollider might be slightly stale
                createExplosion((player.pos.x + e.pos.x)/2, (player.pos.y + e.pos.y)/2, 10, 15, 2);
                // Break because player collided with *an* enemy
                break; // Exit enemy vs player checks for this frame
            }
        }
    }

    // Re-check player status *one last time* before powerup collection
    if (!player) return;

    // 4. Player vs PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
        // No realistic way for player to become null here unless code changes,
        // but the check doesn't hurt.
        if (!player) break; // Stop checking powerups if player died unexpectedly

        let pu = powerUps[i];
        if (!pu) continue; // Check powerup exists

        let d = dist(player.pos.x, player.pos.y, pu.pos.x, pu.pos.y); // Use current player.pos
        if (d < playerColliderRadius + pu.size) {
            // *** This line (was 476) is now safe because of the 'if (!player) return' above ***
            pu.applyEffect(player);
            powerUps.splice(i, 1);
            // Can collect multiple powerups, so no break here.
        }
    }
}


// MODIFY the main draw loop's state machine
function draw() {
    background(0); // Clear screen

    // Apply screen shake effect globally
    push();
    applyScreenShake();

    // Draw background first (always)
    drawStarfield();


    // --- Game State Machine ---
    switch (gameState) {
        case STATE_START:
            drawStartMenu();
            break;
        case STATE_PLAYING:
            runGame(false); // Run updates and drawing
            drawHUD(); // Draw HUD only when playing
            break;
        case STATE_PAUSED:
            runGame(true); // Run drawing only, no updates/collisions
            drawHUD(); // Draw HUD when paused too
            drawPauseMenu(); // Draw pause overlay on top
            break;
        case STATE_GAME_OVER:
            // Option 1: Draw only the Game Over menu (simplest, safest)
            // drawGameOverMenu();

            // Option 2: Draw the frozen game state THEN the menu
            runGame(true); // Draw the last frame's entities (drawing only)
            drawGameOverMenu(); // Draw overlay on top
            break;
    }

    // Restore transform matrix after screen shake
    pop();

    // Update score multiplier regardless of pause state? Or only when playing?
    // Let's do it only when playing. Move it inside STATE_PLAYING case or runGame(!isPaused)
    // (Already moved updateScoreMultiplier inside runGame)


    // Manage Audio Context start (implicitly handled by start game click)
}

function startGame() {
    score = 0;
    enemies = [];
    projectiles = [];
    particles = [];
    powerUps = [];
    player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 50);
    currentEnemySpawnRate = ENEMY_SPAWN_RATE_START;
    enemySpawnTimer = currentEnemySpawnRate;
    difficultyTimer = 0;
    scoreMultiplierActive = false;
    scoreMultiplierEndTime = 0;
    gameState = STATE_PLAYING;

    // Crucial: Resume audio context on user interaction
    startAudioContext();
}

function pauseGame() {
    if (gameState === STATE_PLAYING) {
        gameState = STATE_PAUSED;
        // Stop continuous sounds like railgun charge
        playAudio('stopRailgunCharge');
    } else if (gameState === STATE_PAUSED) {
        gameState = STATE_PLAYING;
        // Resume audio context just in case? Usually not needed if started once.
        startAudioContext();
    }
}

function gameOver() {
    gameState = STATE_GAME_OVER;
    if (score > highScore) {
        highScore = score;
        // Save high score to local storage (optional)
        localStorage.setItem('proceduralShooterHighScore', highScore);
    }
    // Stop continuous sounds
    playAudio('stopRailgunCharge');
    createExplosion(player.pos.x, player.pos.y, 50, 40, 8); // Big player explosion
    player = null; // Remove player object visually
}

function handleEnemySpawning() {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0) {
        spawnEnemy();
        enemySpawnTimer = currentEnemySpawnRate;
    }
}

function spawnEnemy() {
    let side = random(['top', 'left', 'right']);
    let x, y;
    let buffer = 50; // Spawn slightly off-screen

    if (side === 'top') {
        x = random(buffer, SCREEN_WIDTH - buffer);
        y = -buffer;
    } else if (side === 'left') {
        x = -buffer;
        y = random(buffer, SCREEN_HEIGHT * 0.6); // Don't spawn too low on sides
    } else { // Right
        x = SCREEN_WIDTH + buffer;
        y = random(buffer, SCREEN_HEIGHT * 0.6);
    }

    // Choose enemy type (add more variety based on difficulty/score later)
    let enemyType = random([Drone, Weaver, Rusher, MiniCruiser]);
    // Bias towards simpler enemies early on?
    if (score < 500 && random() < 0.6) {
        enemyType = Drone;
    } else if (score < 1500 && random() < 0.4) {
        enemyType = random([Drone, Weaver]);
    } else if (score < 3000 && random() < 0.3) {
        enemyType = Rusher; // Introduce rushers
    }


    enemies.push(new enemyType(x, y));
}

function spawnPowerUp(x, y) {
    let type = random(['WEAPON', 'SHIELD', 'HEALTH', 'SCORE']);
    powerUps.push(new PowerUp(x, y, type));
}

function increaseDifficulty() {
    difficultyTimer++;
    if (difficultyTimer >= DIFFICULTY_INCREASE_INTERVAL) {
        difficultyTimer = 0;
        // Increase spawn rate (decrease interval)
        currentEnemySpawnRate = max(ENEMY_SPAWN_RATE_MIN, currentEnemySpawnRate * 0.95);

        // Could also increase enemy speed, health, firing rate slightly here
        // Example: Make future enemies slightly faster
        // This requires modifying the Enemy constructors or adding multipliers
        console.log("Difficulty Increased! Spawn Rate:", currentEnemySpawnRate.toFixed(1));
    }
}

// --- Collision Detection ---
function handleCollisions() {
    let playerCollider = player ? player.getCollider() : null;
    if (player == null) drawGameOverMenu();
    // 1. Player Projectiles vs Enemies
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (p.owner !== 'player') continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (e.isDead) continue; // Skip dead enemies

            let d = dist(p.pos.x, p.pos.y, e.pos.x, e.pos.y);

            if (d < e.size + p.size / 2) { // Simple circle collision
                if (p.penetrating) {
                    // Railgun hits multiple enemies
                    if (!p.hasHit(e)) { // Check if this enemy was already hit by this projectile
                        e.takeDamage(p.damage);
                        p.registerHit(e); // Mark enemy as hit
                        createExplosion(p.pos.x, p.pos.y, 5, 5, 1); // Small impact effect
                        // Don't remove the projectile yet
                    }
                } else {
                    // Normal projectile hits one enemy
                    e.takeDamage(p.damage);
                    createExplosion(p.pos.x, p.pos.y, 5, 5, 1);
                    projectiles.splice(i, 1); // Remove projectile
                    break; // Move to next projectile
                }
            }
        }
    }

    if (!playerCollider) return; // Skip remaining checks if player is dead

    // 2. Enemy Projectiles vs Player
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        if (p.owner !== 'enemy') continue;

        let d = dist(p.pos.x, p.pos.y, playerCollider.x, playerCollider.y);
        if (d < playerCollider.radius + p.size / 2) {
            player.takeDamage(p.damage);
            createExplosion(p.pos.x, p.pos.y, 5, 5, 1); // Impact effect
            projectiles.splice(i, 1); // Remove projectile
            break; // Player can only be hit once per frame by projectiles loop
        }
    }

    // 3. Player vs Enemies (Collision Damage)
    if (!player.isInvincible && player.hitTimer <= 0) { // Only take collision damage if not invincible/recently hit
        for (let j = enemies.length - 1; j >= 0; j--) {
            let e = enemies[j];
            if (e.isDead) continue;

            let d = dist(playerCollider.x, playerCollider.y, e.pos.x, e.pos.y);
            if (d < playerCollider.radius + e.size * 0.8) { // Use slightly smaller enemy collider
                player.takeDamage(1); // Player takes 1 damage from collision
                e.takeDamage(5); // Enemy also takes significant damage (or dies instantly?)
                // Create effects for collision
                if (player == null) drawGameOverMenu(); // Player is dead, stop checking collisions
                createExplosion((player.pos.x + e.pos.x)/2, (player.pos.y + e.pos.y)/2, 10, 15, 2);
                break; // Player hit, move on
            }
        }
    }

    // 4. Player vs PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        let d = dist(playerCollider.x, playerCollider.y, pu.pos.x, pu.pos.y);
        if (d < playerCollider.radius + pu.size) {
            pu.applyEffect(player);
            powerUps.splice(i, 1); // Remove powerup
            // No break needed, can collect multiple powerups in one frame
        }
    }
}


// --- Drawing Menus and HUD ---

function drawStartMenu() {
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255);
    stroke(0);
    strokeWeight(2);
    text("PROCEDURAL SHOOTER", width / 2, height / 3);

    textSize(32);
    fill(200);
    text("Press ENTER to Start", width / 2, height / 2);

    textSize(24);
    fill(180);
    text(`High Score: ${highScore}`, width / 2, height / 2 + 50);

    // Instructions
    textSize(16);
    fill(150);
    text("Controls:", width / 2, height * 0.7);
    text("WASD / Arrows: Move", width / 2, height * 0.7 + 30);
    text("Spacebar: Shoot / Charge Railgun", width / 2, height * 0.7 + 55);
    text("P: Pause", width / 2, height * 0.7 + 80);
    // text("Shift: Cycle Weapon (or use Powerups)", width / 2, height * 0.7 + 105);

}

function drawPauseMenu() {
    // Draw semi-transparent overlay
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    // Draw pause text
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);
    noStroke();
    text("PAUSED", width / 2, height / 2);
    textSize(24);
    fill(200);
    text("Press P to Resume", width / 2, height / 2 + 50);
}

function drawGameOverMenu() {
    // Optionally add a slight delay or fade in?

    // Draw semi-transparent overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    // Draw game over text
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255, 50, 50); // Red
    noStroke();
    text("GAME OVER", width / 2, height / 3);

    textSize(32);
    fill(255);
    text(`Final Score: ${score}`, width / 2, height / 2);

    textSize(24);
    fill(180);
    text(`High Score: ${highScore}`, width / 2, height / 2 + 50);

    textSize(28);
    fill(200);
    text("Press ENTER to Restart", width / 2, height * 0.7);
}

function drawHUD() {
    push(); // Isolate HUD drawing
    resetMatrix(); // Ensure HUD isn't affected by screen shake translate

    textAlign(LEFT, TOP);
    textSize(20);
    fill(COLOR_HUD[0], COLOR_HUD[1], COLOR_HUD[2]);
    noStroke();

    // Score Display
    text(`Score: ${score}`, 10, 10);

    // High Score Display
    textAlign(RIGHT, TOP);
    text(`High: ${highScore}`, width - 10, 10);

    // Lives Display (Draw hearts or ship icons procedurally)
    textAlign(LEFT, TOP);
    text("Lives: ", 10, 40);
    let lifeIconSize = 15;
    if (player == null) drawGameOverMenu();
    for (let i = 0; i < player.lives; i++) {
        drawPlayerLifeIcon(70 + i * (lifeIconSize + 5), 40 + lifeIconSize * 0.5, lifeIconSize);
    }

    // Current Weapon Display
    textAlign(LEFT, TOP);
    let weaponText = `Weapon: ${player.currentWeapon}`;
    if (scoreMultiplierActive) {
        weaponText += " (Score x2!)"; // Indicate score multiplier
    }
    text(weaponText, 10, 70);


    // Shield Timer Bar (optional)
    if (player.isInvincible && player.shieldTimer > 0) {
        let barWidth = 100;
        let barHeight = 10;
        let currentWidth = map(player.shieldTimer, 0, POWERUP_DURATION, 0, barWidth);
        fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], 100);
        rect(10, 100, barWidth, barHeight);
        fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], 200);
        rect(10, 100, currentWidth, barHeight);
        fill(255);
        textSize(12);
        text("Shield", 15 + barWidth, 100 + barHeight/2);
    }


    pop(); // Restore previous drawing state
}

// Helper to draw a mini player icon for lives
function drawPlayerLifeIcon(x, y, size) {
    push();
    translate(x, y);
    scale(size / 20); // Scale based on original player size assumption

    // Simplified version of player.drawShip()
    strokeWeight(1.5);
    stroke(200, 230, 255);
    fill(COLOR_PLAYER[0], COLOR_PLAYER[1], COLOR_PLAYER[2]);
    beginShape();
    vertex(0, -1 * 10); // Scale factor * size
    vertex(-0.7 * 10, 0.7 * 10);
    vertex(0.7 * 10, 0.7 * 10);
    endShape(CLOSE);
    // Cockpit
    fill(50, 80, 120);
    ellipse(0, -0.1 * 10, 0.5 * 10, 0.8 * 10);

    pop();
}


// --- Parallax Background ---
function createStarfield(layers = 3) {
    stars = [];
    for (let i = 0; i < layers; i++) {
        let layerStars = [];
        let numStars = 100 * (i + 1); // More stars in closer layers
        let speed = 0.5 + i * 0.8;    // Faster speed for closer layers
        let starSize = 1 + i * 0.5;   // Bigger stars in closer layers
        for (let j = 0; j < numStars; j++) {
            layerStars.push({
                x: random(width),
                y: random(height),
                speed: speed,
                size: random(0.5, starSize),
                colorVal: random(100, 200) // Brightness
            });
        }
        stars.push(layerStars);
    }
}

function drawStarfield() {
    noStroke();
    for (let layer of stars) {
        for (let star of layer) {
            // Update star position
            star.y += star.speed;
            if (star.y > height) {
                star.y = random(-10, 0); // Reset slightly above screen
                star.x = random(width);
            }

            // Draw star
            fill(star.colorVal); // Use pre-calculated brightness
            ellipse(star.x, star.y, star.size, star.size);
        }
    }
}


// --- Input Handling ---

function keyPressed() {
    // Start Game / Restart
    if ((gameState === STATE_START || gameState === STATE_GAME_OVER) && keyCode === ENTER) {
        startGame();
        return; // Prevent other key actions on the same frame
    }

    // Pause Game
    if ((keyCode === 80 || keyCode === ESCAPE)) { // P or Escape key
        // Only allow pausing/unpausing during play
        if (gameState === STATE_PLAYING || gameState === STATE_PAUSED) {
            pauseGame();
            return;
        }
    }

    // Player controls only active during gameplay
    if (gameState === STATE_PLAYING && player) {
        player.handleInput(keyCode, true);
    }
}

function keyReleased() {
    // Player controls only active during gameplay
    if (gameState === STATE_PLAYING && player) {
        player.handleInput(keyCode, false);
    }
}

// Optional: Mouse click for shooting?
// function mousePressed() {
//     if (gameState === STATE_PLAYING && player) {
//         player.isShooting = true;
//         // Handle railgun charge start if needed for mouse
//     }
// }
// function mouseReleased() {
//      if (gameState === STATE_PLAYING && player) {
//         player.isShooting = false;
//          // Handle railgun fire on release if needed for mouse
//     }
// }