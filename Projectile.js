// Projectile.js
class Projectile {
    constructor(x, y, vel, owner, damage = 1, type = WEAPON_LASER) {
        this.pos = createVector(x, y);
        this.vel = vel;
        this.owner = owner; // 'player' or 'enemy'
        this.damage = damage;
        this.type = type;
        this.size = this.getSize();
        this.color = (owner === 'player') ? color(COLOR_PROJECTILE_PLAYER) : color(COLOR_PROJECTILE_ENEMY);
        this.trail = []; // For trail effect
        this.trailLength = 5;
        this.penetrating = (type === WEAPON_RAILGUN); // Railgun specific
        this.enemiesHit = []; // Keep track of enemies hit by railgun
    }

    getSize() {
        switch(this.type) {
            case WEAPON_LASER: return 5;
            case WEAPON_SPREAD: return 4;
            case WEAPON_RAILGUN: return 10; // Width of the beam
            default: return 5;
        }
    }

    update() {
        // ... trail logic ...
        this.pos.add(this.vel);

        // Check if off-screen using p5's width and height
        return (this.pos.x < -this.size || this.pos.x > width + this.size ||
            this.pos.y < -this.size || this.pos.y > height + this.size);
    }

    draw() {
        push(); // Isolate drawing state

        // --- Draw Trail ---
        if (this.trail.length > 1) {
            noFill();
            let trailColor = this.color;
            for (let i = this.trail.length - 1; i > 0; i--) {
                let alpha = map(i, 0, this.trail.length -1, 0, 100); // Fade out
                let trailSize = lerp(this.size * 0.5, this.size * 0.1, (this.trail.length - i) / this.trail.length);
                stroke(red(trailColor), green(trailColor), blue(trailColor), alpha);
                strokeWeight(trailSize);
                line(this.trail[i].x, this.trail[i].y, this.trail[i-1].x, this.trail[i-1].y);
            }
        }

        // --- Draw Projectile ---
        noStroke();

        // Glow effect (larger, semi-transparent shape behind)
        fill(red(this.color), green(this.color), blue(this.color), 80);
        ellipse(this.pos.x, this.pos.y, this.size * 2.5, this.size * 2.5);

        // Main projectile shape
        fill(this.color);
        if (this.type === WEAPON_RAILGUN) {
            // Draw as a thick line or rectangle oriented with velocity
            stroke(this.color);
            strokeWeight(this.size);
            let tailPos = p5.Vector.sub(this.pos, this.vel.copy().setMag(this.size * 2)); // Extend back slightly
            line(this.pos.x, this.pos.y, tailPos.x, tailPos.y);
        } else {
            ellipse(this.pos.x, this.pos.y, this.size, this.size);
        }

        pop(); // Restore drawing state
    }

    // Check if this projectile has hit a specific enemy (for railgun)
    hasHit(enemy) {
        return this.enemiesHit.includes(enemy);
    }

    // Record that this projectile hit an enemy (for railgun)
    registerHit(enemy) {
        if (!this.hasHit(enemy)) {
            this.enemiesHit.push(enemy);
        }
    }
}