// effects.js
let screenShakeAmount = 0;
let screenShakeDuration = 0;

function applyScreenShake() {
    if (screenShakeDuration > 0) {
        const shakeX = random(-screenShakeAmount, screenShakeAmount);
        const shakeY = random(-screenShakeAmount, screenShakeAmount);
        translate(shakeX, shakeY);
        screenShakeDuration--;
        if (screenShakeDuration <= 0) {
            screenShakeAmount = 0;
        }
    }
}

function triggerScreenShake(amount, duration) {
    screenShakeAmount = max(screenShakeAmount, amount); // Don't lessen existing shake
    screenShakeDuration = max(screenShakeDuration, duration);
}

function createExplosion(x, y, count = 20, size = 15, force = 5) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(
            x, y,
            p5.Vector.random2D().mult(random(0.5, force)), // Velocity
            random(15, 40), // Lifespan
            lerpColor(color(COLOR_EXPLOSION[0]), color(COLOR_EXPLOSION[1]), random()), // Start Color
            color(COLOR_EXPLOSION[2][0], COLOR_EXPLOSION[2][1], COLOR_EXPLOSION[2][2], 0), // End Color (fades out)
            random(size * 0.2, size), // Start Size
            0 // End Size
        ));
    }
    // Sound
    playAudio('explosion');
    // Screen Shake
    triggerScreenShake(size * 0.2, 15);
}

function createThrusterParticles(x, y, count = 1, baseVel) {
    for (let i = 0; i < count; i++) {
        let vel = baseVel.copy().mult(-1).rotate(random(-0.3, 0.3)).mult(random(0.5, 1.5));
        particles.push(new Particle(
            x, y, vel,
            random(5, 15), // Lifespan
            color(COLOR_THRUSTER[0], COLOR_THRUSTER[1], COLOR_THRUSTER[2], 200), // Start Color
            color(COLOR_THRUSTER[0], COLOR_THRUSTER[1], COLOR_THRUSTER[2], 0),   // End Color
            random(3, 6), // Start Size
            0 // End Size
        ));
    }
}