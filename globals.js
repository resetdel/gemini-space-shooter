// globals.js
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 600;

const PLAYER_START_LIVES = 3;
const PLAYER_ACCELERATION = 0.5;
const PLAYER_DAMPING = 0.95;
const PLAYER_MAX_SPEED = 6;
const PLAYER_SHOOT_COOLDOWN = 10; // Frames for basic laser
const PLAYER_SPREAD_COOLDOWN = 25;
const PLAYER_RAILGUN_CHARGE_TIME = 60; // Frames
const PLAYER_RAILGUN_COOLDOWN = 90; // After firing
const PLAYER_HIT_FLASH_DURATION = 15; // Frames

const ENEMY_SPAWN_RATE_START = 120; // Frames
const ENEMY_SPAWN_RATE_MIN = 30;
const DIFFICULTY_INCREASE_INTERVAL = 300; // Increase difficulty every 5 seconds (approx)

const POWERUP_SPAWN_CHANCE = 0.1; // 10% chance on enemy kill
const POWERUP_DURATION = 300; // Frames (5 seconds) for timed powerups

// Colors (using p5 color objects later is better)
const COLOR_PLAYER = [180, 220, 255];
const COLOR_ENEMY_DRONE = [255, 100, 100];
const COLOR_ENEMY_WEAVER = [150, 255, 150];
const COLOR_ENEMY_RUSHER = [255, 150, 50];
const COLOR_ENEMY_CRUISER = [200, 180, 255];
const COLOR_PROJECTILE_PLAYER = [255, 255, 0];
const COLOR_PROJECTILE_ENEMY = [255, 0, 100];
const COLOR_POWERUP_WEAPON = [0, 255, 255];
const COLOR_POWERUP_SHIELD = [100, 100, 255];
const COLOR_POWERUP_HEALTH = [0, 255, 0];
const COLOR_POWERUP_SCORE = [255, 215, 0]; // Gold
const COLOR_THRUSTER = [255, 180, 0];
const COLOR_EXPLOSION = [[255, 255, 0], [255, 150, 0], [100, 100, 100]]; // Yellow -> Orange -> Grey
const COLOR_WHITE = [255, 255, 255];
const COLOR_HUD = [200, 200, 200];
const COLOR_SHIELD = [150, 150, 255, 150]; // RGBA
const COLOR_RAILGUN_CHARGE = [100, 180, 255];

// Game States
const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_PAUSED = 'PAUSED';
const STATE_GAME_OVER = 'GAME_OVER';

// Weapon Types (Using strings for clarity)
const WEAPON_LASER = 'LASER';
const WEAPON_SPREAD = 'SPREAD';
const WEAPON_RAILGUN = 'RAILGUN';
const WEAPON_TYPES = [WEAPON_LASER, WEAPON_SPREAD, WEAPON_RAILGUN];