// Player.js
class Player {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.size = 20; // Base size for drawing/collision
        this.lives = PLAYER_START_LIVES;
        this.health = 100; // Or use lives only
        this.isMoving = { up: false, down: false, left: false, right: false };
        this.isShooting = false;
        this.shootCooldown = 0;
        this.hitTimer = 0; // For damage flash
        this.isInvincible = false; // Shield active?
        this.shieldTimer = 0;

        // Weapon System
        this.weaponTypes = WEAPON_TYPES;
        this.currentWeaponIndex = 0;
        this.currentWeapon = this.weaponTypes[this.currentWeaponIndex];
        this.railgunCharge = 0;
        this.isChargingRailgun = false;
    }

    handleInput(keyCode, isPressed) {
        switch (keyCode) {
            case UP_ARROW:
            case 87: // W
                this.isMoving.up = isPressed;
                break;
            case DOWN_ARROW:
            case 83: // S
                this.isMoving.down = isPressed;
                break;
            case LEFT_ARROW:
            case 65: // A
                this.isMoving.left = isPressed;
                break;
            case RIGHT_ARROW:
            case 68: // D
                this.isMoving.right = isPressed;
                break;
            case 32: // Spacebar
                if (this.currentWeapon === WEAPON_RAILGUN) {
                    if (isPressed && !this.isChargingRailgun && this.shootCooldown <= 0) {
                        this.isChargingRailgun = true;
                        this.railgunCharge = 0;
                        playAudio('startRailgunCharge');
                    } else if (!isPressed && this.isChargingRailgun) {
                        this.fireRailgun(); // Fire on release
                    }
                } else {
                    this.isShooting = isPressed;
                }
                break;
            case SHIFT: // Example: Weapon Cycle Key
                if (isPressed) { // Only cycle on press down
                    // this.cycleWeapon(); // Cycle via key press instead of powerup only?
                }
                break;
        }
    }

    cycleWeapon() {
        this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weaponTypes.length;
        this.currentWeapon = this.weaponTypes[this.currentWeaponIndex];
        this.shootCooldown = 0; // Reset cooldown when switching
        // Stop charging railgun if switching away from it
        if (this.isChargingRailgun && this.currentWeapon !== WEAPON_RAILGUN) {
            this.isChargingRailgun = false;
            this.railgunCharge = 0;
            playAudio('stopRailgunCharge');
        }
    }


    update() {
        // --- Movement ---
        let moveForce = createVector(0, 0);
        if (this.isMoving.up) moveForce.y -= PLAYER_ACCELERATION;
        if (this.isMoving.down) moveForce.y += PLAYER_ACCELERATION;
        if (this.isMoving.left) moveForce.x -= PLAYER_ACCELERATION;
        if (this.isMoving.right) moveForce.x += PLAYER_ACCELERATION;

        this.vel.add(moveForce);
        this.vel.mult(PLAYER_DAMPING); // Apply damping/friction
        this.vel.limit(PLAYER_MAX_SPEED); // Limit speed

        this.pos.add(this.vel);

        // --- Keep within bounds ---
        this.pos.x = constrain(this.pos.x, this.size / 2, SCREEN_WIDTH - this.size / 2);
        this.pos.y = constrain(this.pos.y, this.size / 2, SCREEN_HEIGHT - this.size / 2);

        // --- Shooting Cooldown & Logic ---
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.currentWeapon === WEAPON_RAILGUN) {
            if (this.isChargingRailgun) {
                this.railgunCharge = min(this.railgunCharge + 1, PLAYER_RAILGUN_CHARGE_TIME);
                playAudio('updateRailgunCharge', this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME);
            }
            // Railgun fires on key release (handleInput -> fireRailgun)
        } else {
            // Handle other weapons (laser, spread)
            if (this.isShooting && this.shootCooldown <= 0) {
                this.shoot();
            }
        }


        // --- Timers ---
        if (this.hitTimer > 0) {
            this.hitTimer--;
        }
        if (this.shieldTimer > 0) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.isInvincible = false;
            }
        }
    }

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
                let spreadAngle = PI / 8; // Total angle for the spread
                for (let i = 0; i < numProjectiles; i++) {
                    let angle = -HALF_PI - spreadAngle / 2 + (spreadAngle / (numProjectiles - 1)) * i;
                    let spreadVel = p5.Vector.fromAngle(angle, projectileSpeed * 0.8); // Slightly slower
                    projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size / 2, spreadVel, 'player', 0.7, WEAPON_SPREAD)); // Less damage per shot
                }
                playAudio('shoot'); // Maybe a different sound for spread?
                break;

            // Railgun is handled by fireRailgun()
        }

        this.shootCooldown = baseCooldown;
    }

    fireRailgun() {
        if (!this.isChargingRailgun) return; // Shouldn't happen, but safety check

        let chargeRatio = this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME;
        // Require minimum charge? Or scale damage/size? Let's scale.
        let railgunDamage = lerp(1, 10, chargeRatio); // Damage scales from 1 to 10
        let railgunSpeed = 15; // Faster projectile
        let railgunVel = createVector(0, -railgunSpeed);

        // Create the penetrating projectile
        projectiles.push(new Projectile(this.pos.x, this.pos.y - this.size / 2, railgunVel, 'player', railgunDamage, WEAPON_RAILGUN));

        // Sound and Cooldown
        playAudio('stopRailgunCharge');
        playAudio('fireRailgun');
        this.shootCooldown = PLAYER_RAILGUN_COOLDOWN; // Cooldown starts AFTER firing
        this.isChargingRailgun = false;
        this.railgunCharge = 0;
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y);

        // --- Draw Shield Effect ---
        if (this.isInvincible) {
            let shieldAlpha = map(this.shieldTimer, 0, POWERUP_DURATION, 50, 150); // Fade out alpha
            shieldAlpha = max(shieldAlpha, map(this.hitTimer, 0, PLAYER_HIT_FLASH_DURATION * 2, 50, 200)); // Stronger flash on hit while shielded
            fill(COLOR_SHIELD[0], COLOR_SHIELD[1], COLOR_SHIELD[2], shieldAlpha * (0.7 + sin(frameCount * 0.2) * 0.3)); // Pulsating alpha
            noStroke();
            ellipse(0, 0, this.size * 2.5, this.size * 2.5);
        }

        // --- Hit Flash ---
        // Flash even if invincible, makes hits clearer
        if (this.hitTimer > 0 && frameCount % 4 < 2) {
            fill(255, 255, 255, 200); // White flash
            // Draw a slightly larger background shape for the flash
            beginShape();
            vertex(0, -this.size * 1.2);
            vertex(-this.size * 0.8, this.size * 0.8);
            vertex(this.size * 0.8, this.size * 0.8);
            endShape(CLOSE);
        }


        // --- Draw Ship Body ---
        this.drawShip();

        // --- Draw Thruster ---
        // Show thruster if moving or accelerating significantly
        let showThruster = this.isMoving.up || this.isMoving.down || this.isMoving.left || this.isMoving.right || this.vel.magSq() > 0.1;
        if (showThruster) {
            this.drawThruster();
            // Optionally emit particles only when moving forward/strafing
            if (this.isMoving.up || this.isMoving.left || this.isMoving.right) {
                createThrusterParticles(this.pos.x, this.pos.y + this.size * 0.6, 1, this.vel);
            }
        }

        // --- Draw Railgun Charge Indicator ---
        if (this.isChargingRailgun) {
            let chargeRatio = this.railgunCharge / PLAYER_RAILGUN_CHARGE_TIME;
            let indicatorSize = lerp(this.size * 0.2, this.size * 1.5, chargeRatio);
            let indicatorAlpha = lerp(50, 200, chargeRatio);
            fill(COLOR_RAILGUN_CHARGE[0], COLOR_RAILGUN_CHARGE[1], COLOR_RAILGUN_CHARGE[2], indicatorAlpha * (0.8 + sin(frameCount*0.3)*0.2));
            noStroke();
            ellipse(0, -this.size * 0.5, indicatorSize, indicatorSize); // Draw in front of ship nose
        }


        pop();
    }

    // --- Procedural Drawing Functions ---

    drawShip() {
        // Example: Composite shape - Triangle main body, rect wings
        strokeWeight(1.5);
        stroke(200, 230, 255); // Light blue outline

        // Main Body (Triangle)
        fill(COLOR_PLAYER[0], COLOR_PLAYER[1], COLOR_PLAYER[2]);
        beginShape();
        vertex(0, -this.size); // Nose
        vertex(-this.size * 0.7, this.size * 0.7); // Bottom Left
        vertex(this.size * 0.7, this.size * 0.7); // Bottom Right
        endShape(CLOSE);

        // Wings (Rectangles or Triangles)
        fill(COLOR_PLAYER[0]*0.8, COLOR_PLAYER[1]*0.8, COLOR_PLAYER[2]*0.8); // Slightly darker blue
        rectMode(CENTER);
        // Simple rect wings:
        // rect(-this.size * 0.6, this.size * 0.3, this.size * 0.5, this.size * 0.8, 2); // Left Wing (Rounded)
        // rect( this.size * 0.6, this.size * 0.3, this.size * 0.5, this.size * 0.8, 2); // Right Wing (Rounded)
        // Swept wings using triangles:
        triangle(-this.size * 0.5, this.size * 0.1, -this.size * 1.2, this.size * 0.5, -this.size * 0.5, this.size * 0.7); // Left
        triangle( this.size * 0.5, this.size * 0.1,  this.size * 1.2, this.size * 0.5,  this.size * 0.5, this.size * 0.7); // Right


        // Cockpit (Ellipse)
        fill(50, 80, 120);
        ellipse(0, -this.size * 0.1, this.size * 0.5, this.size * 0.8);

        rectMode(CORNER); // Reset rectMode
    }

    drawThruster() {
        // Animated ellipse or particle emitter at the rear
        let thrusterSize = this.size * 0.5 + sin(frameCount * 0.5) * this.size * 0.1; // Pulsating size
        let thrusterCol = color(COLOR_THRUSTER[0], COLOR_THRUSTER[1], COLOR_THRUSTER[2], random(150, 255));

        // Draw multiple layers for glow
        noStroke();
        // Outer Glow
        fill(red(thrusterCol), green(thrusterCol), blue(thrusterCol), 50);
        ellipse(0, this.size * 0.8, thrusterSize * 1.8, thrusterSize * 2.5);
        // Mid Glow
        fill(red(thrusterCol), green(thrusterCol), blue(thrusterCol), 150);
        ellipse(0, this.size * 0.8, thrusterSize * 1.2, thrusterSize * 1.8);
        // Core Flame
        fill(255, 255, 200, 230); // Yellowish white core
        ellipse(0, this.size * 0.8, thrusterSize * 0.6, thrusterSize * 1.2);
    }

    takeDamage(amount) {
        if (this.isInvincible) {
            // Shield absorbs hit
            this.hitTimer = PLAYER_HIT_FLASH_DURATION * 2; // Longer flash for shield hit?
            playAudio('hitPlayer'); // Play hit sound even if shielded
            // Optionally damage shield durability if it's not timer based
            this.shieldTimer = 0; // Example: Shield breaks on one hit
            this.isInvincible = false;
            return; // Don't take actual damage
        }

        if (this.hitTimer > 0) {
            return; // Already flashing, brief grace period
        }


        this.lives--; // Or decrease health: this.health -= amount;
        this.hitTimer = PLAYER_HIT_FLASH_DURATION;
        playAudio('hitPlayer');
        triggerScreenShake(3, 10); // Small shake on player hit

        if (this.lives <= 0) {
            // Game Over logic handled in main sketch
            gameOver();
        }
    }

    activateShield(duration) {
        this.isInvincible = true;
        this.shieldTimer = duration;
    }

    getCollider() {
        // Return a simplified collider (circle) for collision checks
        return {
            x: this.pos.x,
            y: this.pos.y,
            radius: this.size * 0.8 // Slightly smaller than visual size
        };
    }
}