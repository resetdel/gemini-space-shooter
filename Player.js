// Player.js
class Player {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.size = 20; // Base size for drawing/collision
        this.lives = PLAYER_START_LIVES;
        this.health = 100; // Or use lives only if preferred

        // Keyboard movement state
        this.isMoving = { up: false, down: false, left: false, right: false };

        // Cooldowns and Timers
        this.shootCooldown = 0;
        this.hitTimer = 0; // For damage flash
        this.isInvincible = false; // Shield active?
        this.shieldTimer = 0;

        // Weapon System
        this.weaponTypes = WEAPON_TYPES; // From globals.js
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weaponTypes[this.currentWeaponIndex];

        // Unified Railgun state (true if charging via *any* input)
        this.isChargingRailgun = false;
        this.railgunCharge = 0;
    }

    // --- Input Handling ---

    // Called by sketch.js keyPressed/keyReleased
    handleKeyboardInput(keyCode, isPressed) {
        switch (keyCode) {
            // Movement Keys
            case UP_ARROW:
            case KEY_W: // Assuming KEY_W=87 etc. are defined in globals or here
                this.isMoving.up = isPressed;
                break;
            case DOWN_ARROW:
            case KEY_S:
                this.isMoving.down = isPressed;
                break;
            case LEFT_ARROW:
            case KEY_A:
                this.isMoving.left = isPressed;
                break;
            case RIGHT_ARROW:
            case KEY_D:
                this.isMoving.right = isPressed;
                break;

            // Firing Key (Spacebar)
            case KEY_SPACE: // Assuming KEY_SPACE=32
                keyboardState.isShootingKeyDown = isPressed; // Update global keyboard fire state

                if (this.currentWeapon === WEAPON_RAILGUN) {
                    if (isPressed && !this.isChargingRailgun && this.shootCooldown <= 0) {
                        // Start charging via Keyboard IF not already charging
                        keyboardState.isChargingRailgun = true; // Mark keyboard as the source
                        this.isChargingRailgun = true;         // Set unified player state
                        this.railgunCharge = 0;
                        playAudio('startRailgunCharge');
                    } else if (!isPressed && keyboardState.isChargingRailgun) {
                        // Fire on key release ONLY if keyboard started this charge cycle
                        this.fireRailgun('keyboard'); // Pass source (optional for debug)
                    }
                }
                break;

            // Optional: Weapon Cycle Key (e.g., Shift)
            // case KEY_SHIFT:
            //    if (isPressed) this.cycleWeapon();
            //    break;
        }
    }

    // --- Core Logic ---

    update(currentTouchInput) { // Receives the global touchInput state
        // --- 1. Calculate Movement Force ---
        let totalMoveForce = createVector(0, 0);

        // a) Keyboard Movement Force
        let keyboardForce = createVector(0, 0);
        if (this.isMoving.up) keyboardForce.y -= PLAYER_ACCELERATION;
        if (this.isMoving.down) keyboardForce.y += PLAYER_ACCELERATION;
        if (this.isMoving.left) keyboardForce.x -= PLAYER_ACCELERATION;
        if (this.isMoving.right) keyboardForce.x += PLAYER_ACCELERATION;
        // Normalize diagonal keyboard movement
        if (keyboardForce.magSq() > 0) {
            keyboardForce.normalize().mult(PLAYER_ACCELERATION);
        }
        totalMoveForce.add(keyboardForce);

        // b) Touch Movement Force (using accumulated delta)
        if (currentTouchInput.isDown) {
            let touchForce = createVector(0, 0);
            let moveSensitivity = 0.08; // Tune this value
            // Apply force based on accumulated delta, then reset delta in sketch.js
            touchForce.x = currentTouchInput.moveDeltaX * moveSensitivity;
            touchForce.y = currentTouchInput.moveDeltaY * moveSensitivity;
            touchForce.limit(PLAYER_ACCELERATION * 1.2); // Limit impulse from fast drag
            totalMoveForce.add(touchForce);

            // IMPORTANT: Reset touch deltas after applying force for this frame
            currentTouchInput.moveDeltaX = 0;
            currentTouchInput.moveDeltaY = 0;
        }

        // --- 2. Apply Force, Damping, Velocity, Position ---
        this.vel.add(totalMoveForce);
        this.vel.mult(PLAYER_DAMPING);
        this.vel.limit(PLAYER_MAX_SPEED);
        this.pos.add(this.vel);

        // --- 3. Keep within Screen Bounds ---
        this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
        this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);

        // --- 4. Update Cooldowns and Timers ---
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.hitTimer > 0) this.hitTimer--;
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.isInvincible = false;
        }

        // --- 5. Handle Firing Logic ---
        // Determine overall firing intent (is Space held OR is touch active?)
        let isFiringIntentActive = keyboardState.isShootingKeyDown || currentTouchInput.isDown;

        if (this.currentWeapon === WEAPON_RAILGUN) {
            // Update charge amount IF currently charging (state set by input handlers)
            if (this.isChargingRailgun) {
                this.railgunCharge = min(this.railgunCharge + 1, PLAYER_RAILGUN_CHARGE_TIME);
                playAudio('updateRailgunCharge', this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME);
            }
            // Actual firing happens on input release (keyReleased / touchEnded)
        } else {
            // Auto-fire for other weapons if intent is active and cooldown ready
            if (isFiringIntentActive && this.shootCooldown <= 0) {
                this.shoot(); // Call basic shoot method
            }
        }
    }

    // --- Weapon Methods ---

    // Basic shoot for Laser/Spread
    shoot() {
        let baseCooldown = 0;
        let projectileSpeed = 8;

        switch(this.currentWeapon) {
            case WEAPON_LASER:
                baseCooldown = PLAYER_SHOOT_COOLDOWN;
                let laserVel = createVector(0, -projectileSpeed);
                projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size / 2, laserVel, 'player', 1, WEAPON_LASER));
                playAudio('shoot');
                break;

            case WEAPON_SPREAD:
                baseCooldown = PLAYER_SPREAD_COOLDOWN;
                let numProjectiles = 3;
                let spreadAngle = PI / 8; // Total angle
                for (let i = 0; i < numProjectiles; i++) {
                    // Calculate angle for each projectile in the spread
                    let angle = -HALF_PI - spreadAngle / 2 + (spreadAngle / (numProjectiles - 1)) * i;
                    let spreadVel = p5.Vector.fromAngle(angle, projectileSpeed * 0.8); // Slightly slower maybe
                    projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size / 2, spreadVel, 'player', 0.7, WEAPON_SPREAD)); // Less damage
                }
                playAudio('shoot'); // Use same sound or different?
                break;
            // Railgun is fired by fireRailgun()
        }
        this.shootCooldown = baseCooldown; // Apply cooldown
    }

    // Fired ONLY by input release handlers (keyReleased/touchEnded)
    fireRailgun(source = 'unknown') { // source is mainly for debugging
        // Check if actually charging and cooldown allows
        if (!this.isChargingRailgun || this.shootCooldown > 0) {
            // If called improperly (e.g., release without charging), ensure state is clean
            this.stopRailgunCharge();
            return;
        }
        // console.log(`Firing railgun triggered by: ${source}`); // Debug log

        // Calculate damage based on charge
        let chargeRatio = this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME;
        let railgunDamage = lerp(1, 10, chargeRatio); // Example damage scaling
        let railgunSpeed = 15;
        let railgunVel = createVector(0, -railgunSpeed);

        // Create the projectile
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size / 2, railgunVel, 'player', railgunDamage, WEAPON_RAILGUN));

        // Play fire sound
        playAudio('fireRailgun');
        // Apply cooldown AFTER firing
        this.shootCooldown = PLAYER_RAILGUN_COOLDOWN;

        // IMPORTANT: Reset charge state using the helper AFTER firing logic
        this.stopRailgunCharge();
    }

    // Helper to reliably stop charging and reset related states
    stopRailgunCharge() {
        if (this.isChargingRailgun) {
            playAudio('stopRailgunCharge'); // Stop charging sound only if it was playing
        }
        this.isChargingRailgun = false; // Reset unified player state
        this.railgunCharge = 0;         // Reset charge amount
        // Also reset the global source trackers
        keyboardState.isChargingRailgun = false;
        touchInput.isRailgunChargingTouch = false;
    }

    // Cycle through available weapons
    cycleWeapon() {
        // If charging when cycling, stop the charge first
        if (this.isChargingRailgun) {
            this.stopRailgunCharge();
        }

        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weaponTypes.length;
        this.currentWeapon = this.weaponTypes[this.currentWeaponIndex];
        this.shootCooldown = 0; // Reset cooldown when switching
    }

    // --- Drawing ---

    draw() {
        push(); // Isolate transformations and styles
        translate(this.pos.x, this.pos.y);

        // Draw Shield Effect (if active)
        if (this.isInvincible) {
            let shieldAlpha = map(this.shieldTimer, 0, POWERUP_DURATION, 50, 150); // Fade out
            shieldAlpha = max(shieldAlpha, map(this.hitTimer, 0, PLAYER_HIT_FLASH_DURATION * 2, 50, 200)); // Stronger on hit
            fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], shieldAlpha * (0.7 + sin(frameCount * 0.2) * 0.3)); // Pulsate
            noStroke();
            ellipse(0, 0, this.size * 2.5, this.size * 2.5); // Draw shield slightly larger than ship
        }

        // Draw Hit Flash (if recently hit)
        // Flash even if invincible to show hit was registered
        if (this.hitTimer > 0 && frameCount % 4 < 2) { // Flicker effect
            fill(255, 255, 255, 200); // Semi-transparent white
            // Draw shape matching ship roughly, slightly larger
            beginShape();
            vertex(0, -this.size * 1.2);
            vertex(-this.size * 0.8, this.size * 0.8);
            vertex(this.size * 0.8, this.size * 0.8);
            endShape(CLOSE);
        }

        // Draw Main Ship Body
        this.drawShip(); // Call procedural ship drawing method

        // Draw Thruster based on velocity
        let showThruster = this.vel.magSq() > 0.5; // Show if moving noticeably
        if (showThruster) {
            this.drawThruster(); // Call procedural thruster drawing
            // Optionally emit particles based on movement
            if (this.vel.magSq() > 1.0) { // Emit only if moving faster
                createThrusterParticles(this.pos.x, this.pos.y + this.size * 0.6, 1, this.vel); // Pass global position
            }
        }

        // Draw Railgun Charge Indicator (if charging)
        if (this.isChargingRailgun) { // Use the unified player state for visual
            let chargeRatio = this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME;
            let indicatorSize = lerp(this.size * 0.2, this.size * 1.5, chargeRatio);
            let indicatorAlpha = lerp(50, 200, chargeRatio);
            fill(COLOR_RAILGUN_CHARGE[0], COLOR_RAILGUN_CHARGE[1], COLOR_RAILGUN_CHARGE[2], indicatorAlpha * (0.8 + sin(frameCount*0.3)*0.2)); // Pulsate
            noStroke();
            ellipse(0, -this.size * 0.5, indicatorSize, indicatorSize); // Draw near nose
        }

        pop(); // Restore previous drawing state
    }

    // Procedural drawing for the ship body
    drawShip() {
        strokeWeight(1.5);
        stroke(200, 230, 255); // Light blue outline

        // Main Body (Triangle)
        fill(COLOR_PLAYER[0], COLOR_PLAYER[1], COLOR_PLAYER[2]);
        beginShape();
        vertex(0, -this.size); // Nose
        vertex(-this.size * 0.7, this.size * 0.7); // Bottom Left Wing Root
        vertex(this.size * 0.7, this.size * 0.7); // Bottom Right Wing Root
        endShape(CLOSE);

        // Wings (Swept using triangles)
        fill(COLOR_PLAYER[0]*0.8, COLOR_PLAYER[1]*0.8, COLOR_PLAYER[2]*0.8); // Slightly darker blue
        // Left Wing
        triangle(-this.size * 0.5, this.size * 0.1, -this.size * 1.2, this.size * 0.5, -this.size * 0.5, this.size * 0.7);
        // Right Wing
        triangle( this.size * 0.5, this.size * 0.1,  this.size * 1.2, this.size * 0.5,  this.size * 0.5, this.size * 0.7);

        // Cockpit (Ellipse)
        fill(50, 80, 120); // Dark blue/grey cockpit
        noStroke(); // No outline for cockpit
        ellipse(0, -this.size * 0.1, this.size * 0.5, this.size * 0.8);
    }

    // Procedural drawing for the thruster effect
    drawThruster() {
        let thrusterBaseSize = this.size * 0.5;
        let pulse = sin(frameCount * 0.5) * this.size * 0.1; // Pulsating factor
        let currentThrusterSize = thrusterBaseSize + pulse;
        let thrusterColor = color(COLOR_THRUSTER[0], COLOR_THRUSTER[1], COLOR_THRUSTER[2]); // Base orange/yellow

        noStroke();
        // Draw multiple layers for a glowing effect
        // Outer Glow (large, faint)
        fill(red(thrusterColor), green(thrusterColor), blue(thrusterColor), 50);
        ellipse(0, this.size * 0.8, currentThrusterSize * 1.8, currentThrusterSize * 2.5); // Elongated shape
        // Mid Glow (medium size, brighter)
        fill(red(thrusterColor), green(thrusterColor), blue(thrusterColor), 150);
        ellipse(0, this.size * 0.8, currentThrusterSize * 1.2, currentThrusterSize * 1.8);
        // Core Flame (small, bright white/yellow)
        fill(255, 255, 200, 230);
        ellipse(0, this.size * 0.8, currentThrusterSize * 0.6, currentThrusterSize * 1.2);
    }

    // --- Damage and State ---

    takeDamage(amount) {
        // If invincible (shielded), absorb hit but maybe flash/remove shield
        if (this.isInvincible) {
            this.hitTimer = PLAYER_HIT_FLASH_DURATION * 1.5; // Longer flash for shield hit
            playAudio('hitPlayer'); // Play sound even if shielded
            // Option 1: Shield breaks on one hit
            this.shieldTimer = 0;
            this.isInvincible = false;
            // Option 2: Shield has health (more complex)
            return; // Don't take actual damage
        }

        // If already flashing from recent hit, grant brief grace period
        if (this.hitTimer > 0) {
            return;
        }

        // Apply damage
        this.lives--; // Or decrease health: this.health -= amount;
        this.hitTimer = PLAYER_HIT_FLASH_DURATION; // Start flash timer
        playAudio('hitPlayer'); // Play damage sound
        triggerScreenShake(3, 10); // Trigger screen shake effect

        // Check for game over
        if (this.lives <= 0) {
            gameOver(); // Call the global game over function in sketch.js
        }
    }

    // Activate shield power-up
    activateShield(duration) {
        this.isInvincible = true;
        this.shieldTimer = duration; // Set shield duration timer
    }

    // Get collider info for collision checks
    getCollider() {
        // Simple circle collider
        return {
            x: this.pos.x,
            y: this.pos.y,
            radius: this.size * 0.8 // Effective radius slightly smaller than visual
        };
    }
}