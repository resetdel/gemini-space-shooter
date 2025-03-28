// globals.js

// Colors
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
const COLOR_POWERUP_SCORE = [255, 215, 0];
const COLOR_THRUSTER = [255, 180, 0];
const COLOR_EXPLOSION = [[255, 255, 0], [255, 150, 0], [100, 100, 100]];
const COLOR_WHITE = [255, 255, 255];
const COLOR_SHIELD = [150, 150, 255, 150];
const COLOR_RAILGUN_CHARGE = [100, 180, 255];
const COLOR_PAUSE_BUTTON = [200, 200, 200, 180];

// --- ADD THIS LINE ---
const COLOR_HUD = [200, 200, 200]; // Default greyish color for HUD text
// --- END ADDITION ---

// REMOVE these fixed constants:
// const SCREEN_WIDTH = 800;
// const SCREEN_HEIGHT = 600;
// We will use p5's width and height variables instead.
const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
const KEY_P = 80;
const KEY_SPACE = 32;
const KEY_SHIFT = 16; // If used for weapon cycle etc.

// Touch control state (can be global or managed within sketch.js)
let touchInput = {
    isDown: false,
    startMillis: 0,
    currentX: 0,
    currentY: 0,
    moveDeltaX: 0, // Accumulated movement delta since last frame
    moveDeltaY: 0,
    isRailgunChargingTouch: false,
};

// Add separate state for keyboard charging
let keyboardState = {
    isChargingRailgun: false,
    isShootingKeyDown: false, // Track if the main shoot key is held
};

// ... (Rest of globals: colors, constants, states, weapon types) ...
const PLAYER_ACCELERATION = 0.5; // Maybe tune this between mobile/PC versions
const PLAYER_MAX_SPEED = 6;
const PLAYER_START_LIVES = 3;
const PLAYER_DAMPING = 0.94;
const PLAYER_SHOOT_COOLDOWN = 10;
const PLAYER_SPREAD_COOLDOWN = 25;
const PLAYER_RAILGUN_CHARGE_TIME = 50; // Slightly faster charge?
const PLAYER_RAILGUN_COOLDOWN = 80;
const PLAYER_HIT_FLASH_DURATION = 15;

const ENEMY_SPAWN_RATE_START = 110; // Adjust as needed
const ENEMY_SPAWN_RATE_MIN = 30;
const DIFFICULTY_INCREASE_INTERVAL = 300;

const POWERUP_SPAWN_CHANCE = 0.1;
const POWERUP_DURATION = 300;

const COLOR_TOUCH_INDICATOR = [255, 255, 255, 50]; // For visual feedback (optional)

// Game States (keep as is)
const STATE_START = 'START';
const STATE_PLAYING = 'PLAYING';
const STATE_PAUSED = 'PAUSED';
const STATE_GAME_OVER = 'GAME_OVER';

// Weapon Types (keep as is)
const WEAPON_LASER = 'LASER';
const WEAPON_SPREAD = 'SPREAD';
const WEAPON_RAILGUN = 'RAILGUN';
const WEAPON_TYPES = [WEAPON_LASER, WEAPON_SPREAD, WEAPON_RAILGUN];

// UI Sizes (relative sizes might be better, but fixed for simplicity first)
const PAUSE_BUTTON_SIZE = 40;
const PAUSE_BUTTON_PADDING = 15;
const MENU_BUTTON_WIDTH = 200;
const MENU_BUTTON_HEIGHT = 50;

