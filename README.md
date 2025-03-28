# gemini-space-shooter
Gemini Space Shooter (P5.js)

[Live version]([https://resetdel.github.io/space-enemies/](https://resetdel.github.io/gemini-space-shooter/))

1. Introduction

1.1. Project Overview: This document outlines the requirements for a 2D top-down space shooter game developed using the P5.js library. The game will feature classic arcade-style gameplay (ship control, shooting enemies, dodging projectiles) but with a strong emphasis on high visual polish, dynamic effects, and smooth performance.

1.2. Unique Selling Proposition: The key differentiator is that all visual assets (sprites, backgrounds, effects, UI elements) will be generated programmatically using P5.js drawing functions. No external image or asset files will be imported. This showcases advanced P5.js capabilities and creates a unique, cohesive visual style.

1.3. Goals:

Deliver a fun and engaging space shooter experience.

Achieve a high level of visual polish and aesthetic appeal solely through P5.js procedural generation.

Implement diverse enemy types and weapon systems for varied gameplay.

Ensure smooth performance (target 60 FPS) in modern web browsers.

Create a reusable codebase and potentially a showcase piece for P5.js skills.

2. Target Audience

Casual gamers looking for a quick, visually appealing arcade experience.

Fans of retro space shooters.

Developers and students interested in P5.js capabilities, procedural generation, and game development principles.

3. Functional Requirements

3.1. Core Gameplay Loop:

Player controls a spaceship.

Player can move the ship within defined screen boundaries.

Player can fire projectiles.

Enemies appear and move according to predefined patterns.

Enemies can fire projectiles at the player.

Collisions between player/enemy projectiles and ships are detected.

Destroying enemies increases the player's score.

The game increases in difficulty over time or waves.

The game ends when the player loses all lives or health.

3.2. Player Ship:

Control: Responsive keyboard input (e.g., WASD or Arrow Keys for movement, Spacebar or Mouse Click for firing).

Movement: Smooth acceleration/deceleration; confined to screen bounds.

Health/Lives: Player starts with a set number of lives or a health bar. Taking damage reduces health/lives. Losing all results in Game Over.

Visuals: Procedurally drawn sprite with distinct features. Includes a dynamic thruster effect (e.g., particle trail, animated shape) when moving. Visual feedback on damage (e.g., flashing, temporary shield effect).

3.3. Weapon Systems:

Requirement: Implement at least three distinct player weapon types.

Examples:

Type 1: Basic Laser: Single, rapid-fire projectile.

Type 2: Spread Shot: Fires multiple projectiles in a cone. Lower fire rate or damage per projectile.

Type 3: Charge Beam / Railgun: Hold fire button to charge, release for a powerful, penetrating shot. Visual charging indicator.

Switching: Weapon switching potentially via power-ups. Clear visual indication of the currently equipped weapon.

Projectiles: Procedurally drawn player projectiles, distinct for each weapon type (e.g., color, shape, trail effect).

3.4. Enemy Types:

Requirement: Implement at least four distinct enemy types (excluding bosses).

Examples:

Type 1: Drone: Simple movement pattern (e.g., straight down, slow drift). May or may not fire basic shots. Easy to destroy.

Type 2: Weaver: Moves in a sinusoidal or unpredictable path. Fires occasionally. Moderate health.

Type 3: Rusher: Moves quickly towards the player's position. May not fire but poses a collision threat. Low health.

Type 4: Mini-Cruiser: Slower, higher health. Fires patterned shots (e.g., bursts, spreads). Takes multiple hits.

Behavior: Each enemy type must have unique movement patterns, firing behaviors (if any), health values, and point values.

Spawning: Enemies spawn dynamically, potentially in waves or based on game time/score, originating from off-screen (typically top or sides). Spawn rates increase with difficulty.

Projectiles: Procedurally drawn enemy projectiles, possibly varying slightly by enemy type (color, speed).

3.5. Scoring & Progression:

Score: Points awarded for destroying enemies, potentially bonus points for combos or collecting items. Score displayed clearly on the HUD.

High Score: Track the highest score achieved during the current session. (Optional: Use localStorage for persistence between sessions).

Difficulty Scaling: Gradually increase enemy spawn rate, enemy speed, enemy health, and/or frequency/complexity of enemy firing patterns as the game progresses.

3.6. Power-ups:

Spawning: Randomly dropped by destroyed enemies.

Types (Examples):

Weapon Upgrade/Switch (Cycles through available weapon types).

Shield: Provides temporary invincibility or absorbs one hit. Visual shield effect around the player ship.

Extra Life / Repair: Restores a life or portion of health.

Score Multiplier: Temporarily increases points gained.

Visuals: Procedurally drawn, easily identifiable icons/shapes for each power-up type. Effects upon collection.

3.7. Game States:

Start Menu: Simple screen with "Start Game" prompt/button and potentially high score display.

Gameplay: The main game loop state.

Pause: Ability to pause/resume the game. Overlay indicating pause status.

Game Over: Displayed upon player defeat. Shows final score and prompts to restart.

4. Non-Functional Requirements

4.1. Visual Polish & Aesthetics:

Style: Cohesive and visually appealing art style achieved entirely through P5.js drawing functions (shapes, lines, curves, potentially pixel manipulation via pixels[] array). Style should be intentional (e.g., clean vector, retro pixelated look simulated with rect, glowing neon).

Animation: Smooth animations for ship movement, enemy movement, projectile travel, and effects. Avoid jerky motion.

Effects (Crucial for Polish):

Particle Systems: For explosions (varied sizes, colors, lifespans), thruster trails, weapon impacts, power-up collection glows.

Screen Shake: Subtle screen shake on major impacts or explosions.

Juice/Feedback: Visual cues for hits (flashing sprites), firing (muzzle flash), collecting items, low health warnings.

Background: Dynamic background (e.g., parallax scrolling starfield with multiple layers, perhaps subtle animated nebula clouds using Perlin noise).

Lighting/Glow Effects: Simulate glow using layered shapes with transparency or potentially custom shaders if scope allows (advanced).

4.2. Performance:

Framerate: Target a consistent 60 FPS on typical desktop hardware in modern browsers (Chrome, Firefox).

Optimization: Efficient drawing logic. Object pooling for projectiles/particles if necessary to manage object creation/destruction overhead. Avoid unnecessary calculations in the main draw loop.

4.3. Audio:

Requirement: Include sound effects and background music to enhance polish and feedback.

Asset Generation: Ideally, generate sounds programmatically using the p5.sound library (oscillators, envelopes, noise). This aligns with the "no imports" philosophy.

SFX: Player shoot, enemy shoot, explosions (various sizes), player hit, enemy hit, power-up collect, UI confirmation.

Music: Simple, looping background track appropriate for a space shooter (e.g., ambient, chiptune-style).

Fallback: If procedural audio proves too complex or detrimental to performance/scope, this constraint might be relaxed only for audio, but procedural generation is strongly preferred.

4.4. Usability & UX:

Controls: Intuitive and responsive. Clear mapping of keys/mouse actions.

HUD: Clean, readable Heads-Up Display showing Score, Lives/Health, and current Weapon (if applicable). Does not obstruct critical gameplay area.

Feedback: Clear and immediate feedback for all significant player actions and game events.

4.5. Code Quality:

Well-structured, commented JavaScript code.

Use of ES6 features (Classes, let/const) where appropriate.

Object-Oriented approach (e.g., classes for Player, Enemy, Projectile, Particle).

Modularity: Separate concerns (e.g., input handling, game logic, rendering).

5. Technical Requirements

5.1. Core Technology: P5.js library (core library required, p5.sound strongly recommended).

5.2. Language: JavaScript (ES6+).

5.3. Platform: Web Browsers (latest versions of Chrome, Firefox, Safari, Edge). Primarily Desktop focus.

5.4. Asset Generation: Strict Requirement: All visual assets (sprites for player, enemies, power-ups; projectiles; background elements; UI elements like fonts/buttons; particle effects) MUST be created procedurally using P5.js drawing functions (rect, ellipse, triangle, line, arc, curve, beginShape/vertex/endShape, fill, stroke, color, potentially pixels[]). No loadImage(), loadFont(), or other external asset loading functions are permitted for visuals.

5.5. Version Control: Git repository (e.g., GitHub, GitLab) for source code management.

6. Procedural Asset Specifications (Examples - To be refined during design)

6.1. Player Ship: Composite shape (e.g., triangle main body, rectangles for wings/engines). Use fill() and stroke() for definition. Animated ellipse or particle emitter at the rear for thruster.

6.2. Enemy Sprites: Define using unique combinations of P5 shapes and colors.

Drone: Simple triangle or quad.

Weaver: Use curveVertex or bezierVertex within beginShape/endShape for a more organic look.

Rusher: Sharp, arrow-like shape using triangle or vertices.

Mini-Cruiser: Larger composite shape, potentially multiple rect and triangle parts. Maybe a rotating turret part drawn separately.

6.3. Projectiles: Simple line, ellipse, or small rect. Use bright fill or stroke. Add glow effect using larger, semi-transparent shapes behind the main projectile shape. Trails using short-lived particles or fading lines.

6.4. Explosions: Particle system emitting ellipse or rect particles from a central point. Particles have random velocities, decreasing size/opacity over lifespan, and color transitions (e.g., yellow -> orange -> dark grey).

6.5. Background Starfield: Draw many small point or ellipse dots at random positions. Implement parallax by having multiple layers of stars moving at different speeds relative to player movement (slower for farther layers).

6.6. UI Font: Draw custom characters using rect, line, or point for a pixelated look, or use P5's built-in text() with standard web fonts (this is acceptable as fonts are typically browser/OS provided, not external files loaded by the game logic itself, though a fully custom drawn font is preferred for uniqueness).

6.7. Power-ups: Distinct shapes and color codes (e.g., 'W' shape for weapon, '+' shape for health, shield circle outline). Use beginShape/endShape for custom letterforms if needed.

7. User Interface (UI) & User Experience (UX) Flow

7.1. Startup: Game loads -> Display Start Menu (Title, "Start Game" button/text, High Score).

7.2. Game Start: Player clicks "Start" -> Transition (optional fade/animation) -> Gameplay state begins. HUD appears. Player ship appears. Enemies start spawning.

7.3. Gameplay: Player interacts via controls. Game provides visual/audio feedback. HUD updates dynamically.

7.4. Pause: Player presses Pause key -> Game logic freezes. Pause overlay displayed. Pressing Pause again resumes.

7.5. Game Over: Player health/lives reach zero -> Gameplay stops. Transition (optional explosion animation, slow-mo) -> Game Over screen displayed (Final Score, High Score, "Restart?" button/text).

7.6. Restart: Player clicks "Restart" -> Reset game state variables (score, lives, player position, clear enemies/projectiles) -> Return to Gameplay state (or optionally back to Start Menu).

8. Future Considerations (Out of Scope for Initial Version)

Boss battles (complex multi-stage enemies).

Multiple levels or distinct zones with different backgrounds/enemy sets.

More weapon types and power-ups.

Online leaderboard.

Mobile/touch controls.

Advanced shaders for effects.

Saving/Loading game progress.

Story elements or cutscenes.

9. Glossary

P5.js: A JavaScript library for creative coding, focusing on making coding accessible for artists, designers, educators, and beginners.

Procedural Generation: Creating data algorithmically rather than manually. In this context, generating visual assets using code.

Sprite: A 2D bitmap or vector object representing a game entity (player, enemy, item). Here, generated via code.

HUD: Heads-Up Display. The status area of the screen showing score, health, etc.

Particle System: A technique used to simulate effects like fire, smoke, explosions by managing a large number of small sprites (particles).

Parallax Scrolling: A technique where background layers move at different speeds to create an illusion of depth.

Juice: Game feel elements (visual/audio feedback, screen shake, etc.) that make interactions feel more impactful and satisfying.
