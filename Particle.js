// Particle.js
class Particle {
    constructor(x, y, vel, lifespan, startColor, endColor, startSize, endSize) {
        this.pos = createVector(x, y);
        this.vel = vel;
        this.lifespan = lifespan;
        this.maxLifespan = lifespan; // Store initial lifespan
        this.startColor = startColor;
        this.endColor = endColor;
        this.startSize = startSize;
        this.endSize = endSize;
        this.isDead = false;
    }

    update() {
        this.pos.add(this.vel);
        this.lifespan--;

        // Apply some friction/damping maybe
        // this.vel.mult(0.98);

        if (this.lifespan <= 0) {
            this.isDead = true;
        }
    }

    draw() {
        if (this.isDead) return;

        let progress = 1.0 - (this.lifespan / this.maxLifespan);
        let currentColor = lerpColor(this.startColor, this.endColor, progress);
        let currentSize = lerp(this.startSize, this.endSize, progress);

        noStroke();
        fill(currentColor);
        ellipse(this.pos.x, this.pos.y, currentSize, currentSize);
    }
}