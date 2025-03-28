// audio.js

// Simple oscillators and envelopes for SFX
let oscShoot, envShoot;
let oscHitPlayer, envHitPlayer;
let oscHitEnemy, envHitEnemy;
let oscExplosion, envExplosion; // Using noise for explosion
let oscPowerup, envPowerup;
let oscRailgunCharge, envRailgunCharge; // Continuous charge sound
let isChargingSoundPlaying = false;

// Background Music (simple loop)
let oscMusic1, oscMusic2, envMusic;
let musicPattern = [60, 62, 64, 62]; // MIDI notes for a simple melody
let musicPatternIndex = 0;
let musicTempo = 200; // Milliseconds per note

function setupAudio() {
    // Must be called after p5 setup completes
    getAudioContext().suspend(); // Wait for user interaction

    // Player Shoot SFX (high pitch blip)
    envShoot = new p5.Envelope(0.01, 0.1, 0.05, 0.0);
    oscShoot = new p5.Oscillator('triangle');
    oscShoot.amp(envShoot);
    oscShoot.freq(880); // A5
    oscShoot.start();

    // Player Hit SFX (lower pitch, short)
    envHitPlayer = new p5.Envelope(0.01, 0.2, 0.1, 0.0);
    oscHitPlayer = new p5.Oscillator('sawtooth');
    oscHitPlayer.amp(envHitPlayer);
    oscHitPlayer.freq(330); // E4
    oscHitPlayer.start();

    // Enemy Hit SFX (slightly different)
    envHitEnemy = new p5.Envelope(0.01, 0.1, 0.05, 0.0);
    oscHitEnemy = new p5.Oscillator('square');
    oscHitEnemy.amp(envHitEnemy);
    oscHitEnemy.freq(440); // A4
    oscHitEnemy.start();

    // Explosion SFX (White Noise burst)
    envExplosion = new p5.Envelope(0.02, 0.5, 0.1, 0.0); // Longer decay
    oscExplosion = new p5.Noise('white');
    oscExplosion.amp(envExplosion);
    oscExplosion.start();

    // Powerup Collect SFX (Ascending pitch)
    envPowerup = new p5.Envelope(0.01, 0.1, 0.3, 0.1);
    oscPowerup = new p5.Oscillator('sine');
    oscPowerup.amp(envPowerup);
    oscPowerup.freq(440); // Start A4
    oscPowerup.start();

    // Railgun Charge SFX (Continuous while charging)
    envRailgunCharge = new p5.Envelope(0.1, 0.8, 1.0, 0.2); // Attack, Decay, Sustain, Release
    oscRailgunCharge = new p5.Oscillator('sawtooth');
    oscRailgunCharge.amp(0); // Start silent
    oscRailgunCharge.freq(110); // A2 base, will modulate
    oscRailgunCharge.start();

    // Background Music Setup (Example: simple arpeggio)
    envMusic = new p5.Envelope(0.05, 0.1, 0.1, 0.0);
    oscMusic1 = new p5.Oscillator('sine');
    oscMusic1.amp(envMusic);
    oscMusic1.freq(440);
    oscMusic1.start();

    oscMusic2 = new p5.Oscillator('triangle'); // Add another layer
    oscMusic2.amp(envMusic);
    oscMusic2.freq(440 * 0.5); // Octave lower
    oscMusic2.phase(0.5); // Slight phase difference
    oscMusic2.start();

    // Start music loop (will be triggered after user interaction)
    // setInterval(playMusicNote, musicTempo); // Using p5's loop might be better
}

function playAudio(type, value = null) {
    if (!getAudioContext() || getAudioContext().state !== 'running') {
        console.warn("Audio context not running. User interaction needed.");
        return;
    }

    switch(type) {
        case 'shoot':
            oscShoot.freq(random(800, 900)); // Slight variation
            envShoot.play(oscShoot);
            break;
        case 'hitPlayer':
            envHitPlayer.play(oscHitPlayer);
            break;
        case 'hitEnemy':
            envHitEnemy.play(oscHitEnemy);
            break;
        case 'explosion':
            // Maybe modulate noise filter? For now, just trigger envelope.
            envExplosion.play(oscExplosion);
            break;
        case 'powerup':
            oscPowerup.freq(midiToFreq(60)); // Start freq C4
            envPowerup.triggerAttack(oscPowerup);
            oscPowerup.freq(midiToFreq(72), 0.2); // Ramp up to C5 quickly
            envPowerup.triggerRelease(oscPowerup, 0.3); // Release after ramp
            break;
        case 'startRailgunCharge':
            if (!isChargingSoundPlaying) {
                oscRailgunCharge.amp(envRailgunCharge.sustainLevel, envRailgunCharge.attackTime); // Ramp up amp
                oscRailgunCharge.freq(110); // Start low freq
                isChargingSoundPlaying = true;
            }
            break;
        case 'updateRailgunCharge': // Call this repeatedly while charging
            if (isChargingSoundPlaying && value !== null) { // value is charge progress (0 to 1)
                let targetFreq = lerp(110, 440, value * value); // Increase pitch exponentially
                oscRailgunCharge.freq(targetFreq, 0.05); // Smooth frequency change
            }
            break;
        case 'stopRailgunCharge':
            if (isChargingSoundPlaying) {
                oscRailgunCharge.amp(0, envRailgunCharge.releaseTime); // Ramp down amp
                isChargingSoundPlaying = false;
            }
            break;
        case 'fireRailgun':
            // Maybe a separate sharp sound? Reuse explosion for now?
            playAudio('explosion'); // Placeholder for distinct railgun fire sound
            break;
        case 'musicTick': // Called from main draw loop
            playMusicNote();
            break;
    }
}

let lastMusicNoteTime = 0;
function playMusicNote() {
    if (!getAudioContext() || getAudioContext().state !== 'running') return;

    let now = millis();
    if (now - lastMusicNoteTime > musicTempo) {
        let note = musicPattern[musicPatternIndex % musicPattern.length];
        let freq = midiToFreq(note);

        oscMusic1.freq(freq, 0.05);
        oscMusic2.freq(freq * 0.5, 0.05); // Lower octave

        envMusic.play(oscMusic1);
        envMusic.play(oscMusic2); // Play both oscillators

        musicPatternIndex++;
        lastMusicNoteTime = now;
    }
}

// Ensure audio starts after user interaction (like clicking 'Start')
function startAudioContext() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume().then(() => {
            console.log("Audio Context Resumed");
            lastMusicNoteTime = millis(); // Initialize music timer
        });
    }
}