// PowerUp.js
class PowerUp {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type; // 'WEAPON', 'SHIELD', 'HEALTH', 'SCORE'
        this.size = 15;
        this.vel = createVector(0, 0.8); // Drift downwards slowly
        this.bobAmount = 0;
        this.bobSpeed = 0.05;
        this.color = this.getColor();
        this.duration = (type === 'SHIELD' || type === 'SCORE') ? POWERUP_DURATION : -1; // Only shield/score are timed
        this.isDead = false;
    }

    getColor() {
        switch(this.type) {
            case 'WEAPON': return color(COLOR_POWERUP_WEAPON);
            case 'SHIELD': return color(COLOR_POWERUP_SHIELD);
            case 'HEALTH': return color(COLOR_POWERUP_HEALTH);
            case 'SCORE': return color(COLOR_POWERUP_SCORE);
            default: return color(200);
        }
    }

    update() {
        this.pos.add(this.vel);
        this.bobAmount += this.bobSpeed;
        // Use p5's height variable
        if (this.pos.y > height + this.size) {
            this.isDead = true;
        }
    }

    draw() {
        push();
        translate(this.pos.x, this.pos.y + sin(this.bobAmount) * 3); // Add slight bobbing
        strokeWeight(2);
        stroke(255);
        fill(this.color);

        // Draw unique shape based on type
        switch(this.type) {
            case 'WEAPON':
                this.drawWeaponIcon();
                break;
            case 'SHIELD':
                this.drawShieldIcon();
                break;
            case 'HEALTH':
                this.drawHealthIcon();
                break;
            case 'SCORE':
                this.drawScoreIcon();
                break;
        }
        pop();
    }

    // --- Procedural Icon Drawing Functions ---

    drawWeaponIcon() {
        // Draw a 'W' like shape
        beginShape();
        vertex(-this.size * 0.5, -this.size * 0.4); // Top left
        vertex(-this.size * 0.3, this.size * 0.4);  // Bottom middle-left
        vertex(0, -this.size * 0.1);               // Middle peak
        vertex(this.size * 0.3, this.size * 0.4);   // Bottom middle-right
        vertex(this.size * 0.5, -this.size * 0.4);  // Top right
        endShape(CLOSE); // Use CLOSE to connect back, or handle manually
    }

    drawShieldIcon() {
        // Draw a circle/arc representing a shield
        noFill();
        stroke(this.color);
        strokeWeight(3)
        arc(0, 0, this.size * 1.2, this.size * 1.2, PI + QUARTER_PI, TWO_PI - QUARTER_PI);
        // Add a smaller solid circle inside?
        fill(this.color);
        noStroke();
        ellipse(0, 0, this.size * 0.5, this.size * 0.5);
    }

    drawHealthIcon() {
        // Draw a '+' shape
        rectMode(CENTER);
        rect(0, 0, this.size * 0.8, this.size * 0.2);
        rect(0, 0, this.size * 0.2, this.size * 0.8);
        rectMode(CORNER); // Reset rectMode
    }

    drawScoreIcon() {
        // Draw a '$' or star shape
        // Simple Star:
        let angle = TWO_PI / 5;
        let halfAngle = angle / 2.0;
        beginShape();
        for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
            let sx = 0 + cos(a) * this.size * 0.6;
            let sy = 0 + sin(a) * this.size * 0.6;
            vertex(sx, sy);
            sx = 0 + cos(a + halfAngle) * this.size * 0.3;
            sy = 0 + sin(a + halfAngle) * this.size * 0.3;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }

    applyEffect(player) {
        playAudio('powerup');
        switch(this.type) {
            case 'WEAPON':
                player.cycleWeapon();
                break;
            case 'SHIELD':
                player.activateShield(this.duration);
                break;
            case 'HEALTH':
                if (player.lives < PLAYER_START_LIVES) {
                    player.lives++;
                }
                // Or restore health if using a health bar system
                break;
            case 'SCORE':
                // Score multiplier needs to be handled in the main game loop
                // For now, just add a flat bonus score
                score += 500;
                // You could add a timed multiplier effect here, managed in sketch.js
                activateScoreMultiplier(this.duration);
                break;
        }
    }
}

// Need this function in sketch.js or globals
let scoreMultiplierActive = false;
let scoreMultiplierEndTime = 0;

function activateScoreMultiplier(duration) {
    scoreMultiplierActive = true;
    scoreMultiplierEndTime = millis() + duration * (1000 / 60); // Convert frames to ms
}

function updateScoreMultiplier() {
    if (scoreMultiplierActive && millis() > scoreMultiplierEndTime) {
        scoreMultiplierActive = false;
    }
}

function getScoreMultiplier() {
    return scoreMultiplierActive ? 2 : 1; // Example: 2x multiplier
}