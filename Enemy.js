// Enemy.js

// Base Enemy Class (Abstract - shouldn't be instantiated directly)
class Enemy {
    constructor(x, y, health, scoreValue, size) {
        this.pos = createVector(x, y);
        this.vel = createVector(0, 1); // Default downward movement
        this.health = health;
        this.maxHealth = health;
        this.scoreValue = scoreValue;
        this.size = size; // Radius or approximate size for collisions/drawing
        this.isDead = false;
        this.hitTimer = 0; // For hit flash effect
        this.shootCooldown = random(60, 120); // Random initial cooldown
        this.shootTimer = this.shootCooldown;
    }

    // To be overridden by subclasses
    move() {
        this.pos.add(this.vel);
    }

    // To be overridden by subclasses
    shoot() {
        // Default: No shooting
    }

    // To be overridden by subclasses
    drawBody() {
        // Placeholder drawing - Subclasses MUST implement this
        fill(150);
        stroke(255);
        ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
    }

    update(player) { // Pass player for behaviors that target the player
        if (this.isDead) return;

        this.move(player); // Pass player to move function if needed (e.g., Rusher)

        // Basic shooting timer logic
        this.shootTimer--;
        if (this.shootTimer <= 0) {
            this.shoot(player); // Pass player for aiming
            this.shootTimer = this.shootCooldown; // Reset cooldown
        }

        if (this.hitTimer > 0) {
            this.hitTimer--;
        }

        // Check if off-screen (bottom)
        if (this.pos.y > SCREEN_HEIGHT + this.size * 2) { // Added buffer
            this.isDead = true; // Mark for removal, no points awarded
        }
    }

    draw() {
        if (this.isDead) return;

        push();
        translate(this.pos.x, this.pos.y);

        // Hit flash effect
        if (this.hitTimer > 0 && frameCount % 4 < 2) { // Flashing effect
            fill(255, 255, 255, 200); // White flash
            // Draw slightly larger shape for flash? Or just change color.
            ellipse(0, 0, this.size * 2.2, this.size * 2.2);
        } else {
            this.drawBody(); // Call the specific drawing method of the subclass
        }


        // Optional: Draw health bar above enemy
        // let healthPercent = this.health / this.maxHealth;
        // rectMode(CORNER);
        // fill(255, 0, 0);
        // rect(-this.size, -this.size - 10, this.size * 2, 5);
        // fill(0, 255, 0);
        // rect(-this.size, -this.size - 10, this.size * 2 * healthPercent, 5);

        pop();
    }

    takeDamage(amount) {
        if (this.isDead) return; // Already dead

        this.health -= amount;
        this.hitTimer = PLAYER_HIT_FLASH_DURATION; // Use same duration as player?
        playAudio('hitEnemy');

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        score += this.scoreValue * getScoreMultiplier(); // Award score (with multiplier)
        createExplosion(this.pos.x, this.pos.y, floor(this.size), this.size * 1.5, this.size * 0.3); // Bigger explosion for bigger enemies

        // Chance to spawn power-up
        if (random() < POWERUP_SPAWN_CHANCE) {
            spawnPowerUp(this.pos.x, this.pos.y);
        }
    }
}

// --- Enemy Subclasses ---

class Drone extends Enemy {
    constructor(x, y) {
        super(x, y, 1, 10, 15); // Health: 1, Score: 10, Size: 15
        this.vel = createVector(random(-0.5, 0.5), random(1.0, 2.0)); // Slight drift + downward
        this.color = color(COLOR_ENEMY_DRONE);
        this.shootCooldown = random(100, 180); // Slower firing
        this.shootTimer = this.shootCooldown;
    }

    move(player) {
        // Simple drift
        this.pos.add(this.vel);
        // Add very slight wobble?
        this.pos.x += sin(frameCount * 0.05 + this.pos.y * 0.1) * 0.3;
    }

    shoot(player) {
        // Fire simple shot downwards
        let projVel = createVector(0, 3); // Downward velocity
        projectiles.push(new Projectile(this.pos.x, this.pos.y + this.size, projVel, 'enemy', 1));
        // playAudio('enemyShoot'); // Need a distinct enemy shoot sound
    }

    drawBody() {
        fill(this.color);
        stroke(255);
        strokeWeight(1);
        // Simple triangle shape
        triangle(
            0, -this.size * 0.8, // Top point
            -this.size, this.size * 0.6, // Bottom left
            this.size, this.size * 0.6  // Bottom right
        );
        // Small circle in middle
        fill(255);
        ellipse(0, 0, this.size * 0.4, this.size * 0.4);
    }
}

class Weaver extends Enemy {
    constructor(x, y) {
        super(x, y, 3, 30, 20); // Health: 3, Score: 30, Size: 20
        this.baseYVel = random(1.5, 2.5);
        this.weaveFrequency = random(0.01, 0.03);
        this.weaveAmplitude = random(50, 150);
        this.color = color(COLOR_ENEMY_WEAVER);
        this.shootCooldown = random(80, 140);
        this.shootTimer = this.shootCooldown;
    }

    move(player) {
        this.pos.y += this.baseYVel;
        this.pos.x = (SCREEN_WIDTH / 2) + sin(this.pos.y * this.weaveFrequency) * this.weaveAmplitude;
        // Keep within horizontal bounds slightly
        this.pos.x = constrain(this.pos.x, this.size, SCREEN_WIDTH - this.size);
    }

    shoot(player) {
        // Fire slightly aimed shot
        let angleToPlayer = atan2(player.pos.y - this.pos.y, player.pos.x - this.pos.x);
        let projVel = p5.Vector.fromAngle(angleToPlayer, 3.5); // Aimed velocity
        projectiles.push(new Projectile(this.pos.x, this.pos.y, projVel, 'enemy', 1));
        // playAudio('enemyShoot');
    }

    drawBody() {
        fill(this.color);
        stroke(0);
        strokeWeight(1.5);
        // Use curveVertex for a smoother, organic shape
        beginShape();
        curveVertex(0, -this.size * 1.5); // Control point above
        curveVertex(0, -this.size * 0.8); // Top point
        curveVertex(this.size, 0);       // Right point
        curveVertex(0, this.size * 0.8);  // Bottom point
        curveVertex(-this.size, 0);      // Left point
        curveVertex(0, -this.size * 0.8); // Close loop (back to top)
        curveVertex(0, -this.size * 1.5); // Control point above
        endShape();

        // Add some detail
        fill(0, 50); // Darker center
        ellipse(0, 0, this.size * 0.6, this.size);
    }
}

class Rusher extends Enemy {
    constructor(x, y) {
        super(x, y, 2, 20, 18); // Health: 2, Score: 20, Size: 18
        this.speed = random(3.0, 4.5);
        this.color = color(COLOR_ENEMY_RUSHER);
        this.angle = 0; // Store angle for drawing orientation
        // Rushers typically don't shoot
        this.shootTimer = Infinity;
    }

    move(player) {
        let direction = p5.Vector.sub(player.pos, this.pos);
        this.angle = direction.heading(); // Get angle towards player
        direction.normalize();
        this.vel = direction.mult(this.speed);
        this.pos.add(this.vel);
    }

    drawBody() {
        rotate(this.angle + HALF_PI); // Point towards direction of movement
        fill(this.color);
        stroke(255, 200, 0);
        strokeWeight(2);
        // Arrow-like shape using triangle or vertices
        beginShape();
        vertex(0, -this.size);          // Tip
        vertex(-this.size * 0.6, this.size * 0.8); // Back left wing
        vertex(0, this.size * 0.3);     // Back center indent
        vertex(this.size * 0.6, this.size * 0.8);  // Back right wing
        endShape(CLOSE);

        // Small engine flare?
        fill(255, 255, 0, 150);
        noStroke();
        ellipse(0, this.size * 0.7, this.size * 0.4, this.size * 0.6);
    }
}

class MiniCruiser extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 50, 35); // Health: 8, Score: 50, Size: 35
        this.vel = createVector(0, random(0.5, 1.0)); // Slow downward movement
        this.color = color(COLOR_ENEMY_CRUISER);
        this.shootCooldown = random(90, 150);
        this.shootTimer = this.shootCooldown;
        this.burstCount = 0; // For firing bursts
        this.burstDelay = 10; // Frames between burst shots
    }

    move(player) {
        this.pos.add(this.vel);
        // Add slight side-to-side drift
        this.pos.x += cos(frameCount * 0.02 + this.pos.y * 0.05) * 0.5;
        this.pos.x = constrain(this.pos.x, this.size, SCREEN_WIDTH - this.size);
    }

    shoot(player) {
        if (this.burstCount <= 0) {
            // Start a burst of 3 shots
            this.burstCount = 3;
            this.shootTimer = this.burstDelay; // Short delay between burst shots
        }

        // Fire one shot of the burst
        let spreadAngle = 0.15; // Small spread
        let baseAngle = PI / 2; // Downwards

        // First shot straight down
        let angle1 = baseAngle;
        // Second shot slightly left
        let angle2 = baseAngle - spreadAngle;
        // Third shot slightly right
        let angle3 = baseAngle + spreadAngle;

        let fireAngle;
        if (this.burstCount === 3) fireAngle = angle2;
        else if (this.burstCount === 2) fireAngle = angle1;
        else fireAngle = angle3;

        let projVel = p5.Vector.fromAngle(fireAngle, 3.0);
        projectiles.push(new Projectile(this.pos.x, this.pos.y + this.size, projVel, 'enemy', 1));

        this.burstCount--;

        if (this.burstCount <= 0) {
            // Reset for next full burst cooldown after burst finishes
            this.shootTimer = this.shootCooldown + random(-20, 20);
        } else {
            // Set timer for next shot in the burst
            this.shootTimer = this.burstDelay;
        }
        // playAudio('enemyShoot');
    }

    drawBody() {
        // More complex composite shape
        fill(this.color);
        stroke(50);
        strokeWeight(1);

        // Main body (rectangle)
        rectMode(CENTER);
        rect(0, 0, this.size * 1.8, this.size * 1.2, 5); // Rounded corners

        // Wings (triangles or rects)
        fill(red(this.color) * 0.8, green(this.color) * 0.8, blue(this.color) * 0.8); // Slightly darker
        triangle(-this.size * 0.9, -this.size * 0.3, -this.size * 1.5, 0, -this.size * 0.9, this.size * 0.3); // Left wing
        triangle( this.size * 0.9, -this.size * 0.3,  this.size * 1.5, 0,  this.size * 0.9, this.size * 0.3); // Right wing

        // Cockpit/Bridge (ellipse)
        fill(100, 150, 200);
        ellipse(0, -this.size * 0.3, this.size * 0.6, this.size * 0.4);

        // Engine pods?
        fill(100);
        rect(-this.size * 0.5, this.size * 0.6, this.size * 0.4, this.size * 0.3);
        rect( this.size * 0.5, this.size * 0.6, this.size * 0.4, this.size * 0.3);


        rectMode(CORNER); // Reset rectMode
    }
}