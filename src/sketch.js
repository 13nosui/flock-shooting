

let particles = [];
const NUM_PARTICLES = 3;
let obstacles = [];
let leader;
let myFont;
let boundsX, boundsY, boundsZ;
let flashAlpha = 0;
let started = false;
let score = 0;
let isInverted = false;
let grid;
let bullets = [];
let enemyBullets = [];
let scenery = [];
let boss = null;
let isBossActive = false;
let curCamX = 0;
let titleParticles = [];
let midBoss = null;
let midBossDefeated = false;
let bossDefeated = false; // Prevents immediate respawn
let joystickActive = false;
let joyStartX = 0;
let joyStartY = 0;
let bossSpawnDelay = 0;
let totalDistance = 0;


let moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let osc, noiseOsc, env, shotEnv, itemEnv, sawOsc;
let midBossBgmOsc, midBossBgmEnv;
let wheelForceY = 0;
let leaderHistory = [];
const MAX_HISTORY = 100;
let items = [];
let gameState = "START";
let lastShotTime = 0;
const SHOT_COOLDOWN = 150; // Milliseconds between shots
let allDebris = [];
let weaponMode = 'NORMAL';
let weaponTimer = 0;
let enemiesDefeated = 0;
let totalDamageDealt = 0;
let totalBulletsFired = 0;
let floatingTexts = [];
let shakeMagnitude = 0;
let shakeDecay = 0.9;
let glitchIntensity = 0;

function preload() {
    myFont = loadFont('assets/RobotoMono-VariableFont_wght.ttf');
}
function setup() {
    setAttributes('antialias', false);
    createCanvas(windowWidth, windowHeight, WEBGL);
    noSmooth();
    updateBounds();

    osc = new p5.Oscillator('sine');
    noiseOsc = new p5.Noise('white');
    env = new p5.Envelope();
    env.setADSR(0.01, 0.1, 0, 0);

    shotEnv = new p5.Envelope();
    shotEnv.setADSR(0.001, 0.05, 0, 0);

    itemEnv = new p5.Envelope();
    itemEnv.setADSR(0.001, 0.2, 0, 0);

    noiseOsc.amp(0);
    noiseOsc.start();
    osc.amp(0);
    osc.start();

    sawOsc = new p5.Oscillator('sawtooth');
    sawOsc.amp(0);
    sawOsc.start();

    midBossBgmOsc = new p5.Oscillator('square');
    midBossBgmOsc.amp(0);
    midBossBgmOsc.start();
    midBossBgmEnv = new p5.Envelope();
    midBossBgmEnv.setADSR(0.01, 0.1, 0, 0);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        let p = new WireCross(i === 0);
        particles.push(p);
        if (i === 0) leader = p;
    }
    grid = new Grid();
    curCamX = 0;

    if (myFont) initTitleParticles();
}

function updateBounds() {
    boundsX = width / 2;
    boundsY = height / 2;
    boundsZ = 1000;
}

function initTitleParticles() {
    if (!myFont) return; // Safety check
    titleParticles = [];
    let txt = "Flock Shooting";
    let fontSize = min(width / 12, 60);

    let bounds = myFont.textBounds(txt, 0, 0, fontSize);
    let startX = -bounds.w / 2;
    let startY = bounds.h / 2;

    let points = myFont.textToPoints(txt, startX, startY, fontSize, {
        sampleFactor: 0.2,
        simplifyThreshold: 0
    });

    for (let pt of points) {
        titleParticles.push(new TitleParticle(pt.x, pt.y));
    }
}

function isTouchingUI() {
    // Left Stick Zone
    let stickX = width * 0.15;
    let stickY = height - 100;
    if (dist(mouseX, mouseY, stickX, stickY) < 100) return true;
    return false;
}

function draw() {
    // 0. Background & Lighting
    if (isBossActive) {
        // EMERGENCY MODE: Red Background
        background(30, 0, 0); // Dark red
        ambientLight(100, 0, 0);
    } else if (isInverted) {
        background(255); // White (Inverted)
        ambientLight(150);
    } else {
        background(0); // Black (Normal)
        ambientLight(100);
    }

    if (gameState === "START") {
        drawStartScreen();
        return;
    }

    if (gameState === "GAMEOVER") {
        drawGameOverScreen();
        return;
    }

    handleInput();

    // Record leader history
    if (leader) {
        leaderHistory.unshift(leader.pos.copy());
        if (leaderHistory.length > MAX_HISTORY) leaderHistory.pop();
    }

    push();
    // High-angle top-down view
    curCamX = lerp(curCamX, leader.pos.x * 0.5, 0.05);

    // Look slightly ahead of the leader
    let lookX = leader.pos.x * 0.2;
    let lookY = 0;
    let lookZ = leader.pos.z - 500;

    // Shake logic before camera
    let shakeX = random(-shakeMagnitude, shakeMagnitude);
    let shakeY = random(-shakeMagnitude, shakeMagnitude);
    let shakeZ = random(-shakeMagnitude, shakeMagnitude);
    shakeMagnitude *= shakeDecay;
    if (shakeMagnitude < 0.1) shakeMagnitude = 0;

    // 1. Define variables FIRST (in the main scope of draw)
    let finalCamX = curCamX + shakeX;
    let finalCamY = -1200 + shakeY;
    let finalCamZ = leader.pos.z + 800 + shakeZ;

    // 2. Perform Safety Check & Apply Camera
    // --- SAFETY CHECK ---
    if (!isNaN(finalCamX) && !isNaN(finalCamY) && !isNaN(finalCamZ) &&
        !isNaN(lookX) && !isNaN(lookY) && !isNaN(lookZ)) {
        camera(finalCamX, finalCamY, finalCamZ, lookX, lookY, lookZ, 0, 1, 0);
    } else {
        console.warn("Camera NaN detected! Skipping update.");
    }
    // --------------------



    // --- GRID CONTROL ---
    let gridShake = 0;
    let gridWave = 0;

    if (isBossActive) {
        gridShake = 20; // Violent shake
        gridWave = 100; // Big wave motion
    } else if (midBoss) {
        gridShake = 5;  // Subtle shake
        gridWave = 0;
    }

    if (midBoss) {
        midBoss.update();
        midBoss.display();

        // BGM: Rhythmic Pulse
        if (frameCount % 30 === 0) {
            midBossBgmOsc.freq(100); // Low hum
            midBossBgmEnv.play(midBossBgmOsc);
        }
        if (frameCount % 30 === 15) {
            midBossBgmOsc.freq(50); // Sub bass
            midBossBgmEnv.play(midBossBgmOsc);
        }

        // Bullet Collision with Mid-Boss
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i];
            if (!b.active) continue;

            let d = dist(b.pos.x, b.pos.y, b.pos.z, midBoss.pos.x, midBoss.pos.y, midBoss.pos.z);
            if (d < 150) { // Increased hit radius
                if (midBoss.takeDamage(1)) {
                    // --- MID BOSS DEFEATED ---
                    spawnExplosion(midBoss.pos.x, midBoss.pos.y, midBoss.pos.z);
                    addScreenShake(50); // Big shake
                    score += 1500; // Big score
                    midBossDefeated = true;

                    // Stop BGM immediately
                    if (midBossBgmOsc) midBossBgmOsc.amp(0);

                    // DESTROY OBJECT
                    midBoss = null;

                    // Force break to prevent further processing of this boss instance
                    break;
                } else {
                    // Just a hit
                    spawnDamageText(b.pos.x, b.pos.y - 100, b.pos.z, 1);
                    if (typeof hitSound === 'function') hitSound();
                }

                if (!b.penetrate) b.active = false;
            }
        }
    }

    // Sync grid speed with leader's forward velocity
    let forwardSpeed = 15 - leader.vel.z;
    totalDistance += forwardSpeed;

    grid.update(forwardSpeed);
    grid.display(gridShake, gridWave); // Pass both params

    // --- MID BOSS SPAWN ---
    // UPDATED: Spawn based on distance (approx 6000 units) instead of score
    if (!midBoss && !midBossDefeated && totalDistance > 6000) {
        midBoss = new MidBoss();
        obstacles = []; // Clear normal enemies
    }


    // --- BOSS SPAWN LOGIC ---
    // Spawn Boss ONLY if MidBoss is defeated
    if (midBossDefeated && !boss && !bossDefeated) {
        bossSpawnDelay++;

        // Wait ~3 seconds after MidBoss death before Boss appears
        if (bossSpawnDelay > 180) {
            boss = new Boss();
            isBossActive = true;
            bossSpawnDelay = 0;
        }
    }
    if (boss) {
        boss.update();
        boss.display();
        if (!boss.active) {
            // --- UPDATED: Massive Explosion for Boss Death ---
            for (let k = 0; k < 15; k++) {
                spawnExplosion(
                    boss.pos.x + random(-150, 150),
                    boss.pos.y + random(-100, 100),
                    boss.pos.z + random(-150, 150)
                );
            }
            // -------------------------------------------------
            addScreenShake(50);
            triggerGlitch(1.0);
            score += 1000;
            boss = null;
            bossDefeated = true; // Mark as done for this session
            isBossActive = false; // END EMERGENCY MODE
        }
    }

    // Scenery Logic - DISABLED for cleaner look
    /*
    if (frameCount % 10 === 0) {
        scenery.push(new Scenery());
    }
    for (let i = scenery.length - 1; i >= 0; i--) {
        scenery[i].update(30); // Parallax speed
        scenery[i].display();
        if (!scenery[i].active) scenery.splice(i, 1);
    }
    */

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        bullets[i].display();

        // Collision with obstacles
        for (let j = obstacles.length - 1; j >= 0; j--) {
            let b = bullets[i];
            let o = obstacles[j];
            let d = dist(b.pos.x, b.pos.y, b.pos.z, o.pos.x, o.pos.y, o.pos.z);
            if (d < o.size / 2 + 20) {
                // Enemy takes damage
                let isDestroyed = o.takeDamage(1);
                totalDamageDealt++;
                spawnDamageText(o.pos.x, o.pos.y - o.size / 2 - 50, o.pos.z, 1);
                if (typeof hitSound === 'function') hitSound();

                if (isDestroyed) {
                    // Death Logic
                    enemiesDefeated++;
                    if (o.type === 'TANK') addScreenShake(15);
                    let dropType = o.getDropItemType();
                    items.push(new Item(o.pos.x, o.pos.y, o.pos.z, dropType));
                    spawnExplosion(o.pos.x, o.pos.y, o.pos.z);
                    triggerHitEffect();
                    if (typeof destroySound === 'function') destroySound();
                }

                if (!b.penetrate) {
                    b.active = false;
                }
                break;
            }
        }

        // Check Boss Collision
        if (boss && bullets[i].active) {
            let hitResult = boss.takeDamage(1, bullets[i].pos);

            if (hitResult === 'DESTROYED') {
                // Trigger Death Logic Immediately
                boss.active = false;
            }

            if (hitResult !== 'MISS') {
                spawnDamageText(bullets[i].pos.x, bullets[i].pos.y - 100, bullets[i].pos.z, 1);
                if (typeof hitSound === 'function') hitSound();
                if (!bullets[i].penetrate) bullets[i].active = false;

                if (hitResult === 'SHIELD') {
                    spawnDamageText(bullets[i].pos.x, bullets[i].pos.y - 100, bullets[i].pos.z, "SHIELD");
                }
            }
        }

        if (!bullets[i].active) bullets.splice(i, 1);
    }

    // Update Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        let eb = enemyBullets[i];
        eb.update();
        eb.display();

        // Hit Player?
        if (leader && eb.active) {
            let d = dist(eb.pos.x, eb.pos.y, eb.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
            if (d < 30) {
                damageFlock(5);
                eb.active = false;
                addScreenShake(10);
            }
        }

        if (!eb.active) enemyBullets.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
        items[i].update(leader.pos);
        items[i].display();

        // Collector with leader
        let d = dist(items[i].pos.x, items[i].pos.y, items[i].pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (d < 50) {
            itemEnv.play(osc);
            osc.freq(880);

            if (items[i].type === 'GROWTH') {
                growFlock(2);
            } else {
                weaponMode = items[i].type;
                weaponTimer = 600; // 10 seconds
            }
            items.splice(i, 1);
        } else if (!items[i].active) {
            items.splice(i, 1);
        }
    }

    // Difficulty Ramp Logic
    let difficulty = 1.0 + (score * 0.001);
    let spawnInterval = floor(map(constrain(difficulty, 1, 5), 1, 5, 60, 15));

    if (!boss && frameCount % spawnInterval === 0) obstacles.push(new VoxelObstacle(difficulty));
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].display();

        // Leader hit obstacle
        let d = dist(obstacles[i].pos.x, obstacles[i].pos.y, obstacles[i].pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (obstacles[i].active && !obstacles[i].isHit && d < obstacles[i].size / 2 + 30) {
            obstacles[i].isHit = true;
            damageFlock(20);
            obstacles[i].active = false;
        }

        if (!obstacles[i].active) obstacles.splice(i, 1);
    }

    for (let i = allDebris.length - 1; i >= 0; i--) {
        allDebris[i].update();
        allDebris[i].display();
        if (allDebris[i].life <= 0) allDebris.splice(i, 1);
    }

    // Update Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update();
        floatingTexts[i].display();
        if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
    }

    leader.updateAsLeader();
    for (let p of particles) {
        if (!p.isLeader) p.flock(particles, leader.pos, leaderHistory);
        p.update();
        p.display();
    }
    pop();

    drawUI();
    if (flashAlpha > 0) drawFlash();

    if (weaponTimer > 0) {
        weaponTimer--;
        if (weaponTimer === 0) weaponMode = 'NORMAL';
    }

    if (glitchIntensity > 0) {
        drawGlitch();
        glitchIntensity -= 0.05;
    }
}

function handleInput() {
    let wind = createVector(0, 0, 0);
    let power = 5.0;

    // Keyboard (X-Z plane only)
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) wind.x = -power;
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) wind.x = power;
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) wind.z = -power;
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) wind.z = power;

    // Dynamic Joystick Logic
    if (mouseIsPressed) {
        if (!joystickActive) {
            joystickActive = true;
            joyStartX = mouseX;
            joyStartY = mouseY;
        }

        let dx = mouseX - joyStartX;
        let dy = mouseY - joyStartY;
        let d = dist(mouseX, mouseY, joyStartX, joyStartY);
        let maxR = 80;

        if (d > 5) {
            let r = min(d, maxR);
            let angle = atan2(dy, dx);
            wind.x = map(r * cos(angle), -maxR, maxR, -power, power);
            wind.z = map(r * sin(angle), -maxR, maxR, -power, power);
        }
    } else {
        joystickActive = false;
    }

    if (leader && leader.applyForce) {
        // --- FIX: FORCE LOCK Y-AXIS ---
        leader.pos.y = 0;
        leader.vel.y = 0;
        // ------------------------------
        leader.applyForce(wind);
    }

    if (wind.mag() > 0) {
        osc.freq(120 + leader.vel.mag() * 5, 0.1);
        osc.amp(0.08, 0.1);
    } else {
        osc.amp(0, 0.2);
    }

    // Auto Fire
    if (gameState === "PLAY") {
        if (mouseIsPressed || keyIsDown(32)) {
            let currentTime = millis();
            if (currentTime - lastShotTime > SHOT_COOLDOWN) {
                fire();
                lastShotTime = currentTime;
            }
        }
    }
}



function drawUI() {
    push();
    resetMatrix();
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, -1000, 1000);
    drawingContext.disable(drawingContext.DEPTH_TEST);

    if (myFont) textFont(myFont); else textFont('Courier New');

    let col = isInverted ? 0 : 255;
    stroke(col, 150);
    noFill();

    // Joystick Position Logic
    let drawBaseX, drawBaseY;

    if (joystickActive) {
        // Active: Draw at touch point (converted to ortho center-relative)
        drawBaseX = joyStartX - width / 2;
        drawBaseY = joyStartY - height / 2;
        stroke(col, 200); // Brighter when active
    } else {
        // Inactive: Draw at default position (Left side)
        drawBaseX = -width * 0.35;
        drawBaseY = height * 0.35;
        stroke(col, 50); // Dim when inactive
    }

    // Draw Base
    ellipse(drawBaseX, drawBaseY, 160, 160);

    // Draw Handle
    let handleX = drawBaseX;
    let handleY = drawBaseY;

    if (joystickActive) {
        let dx = (mouseX - width / 2) - drawBaseX;
        let dy = (mouseY - height / 2) - drawBaseY;
        let d = dist(0, 0, dx, dy);
        let r = min(d, 80);
        let angle = atan2(dy, dx);
        handleX += cos(angle) * r;
        handleY += sin(angle) * r;
        fill(col, 200);
    } else {
        fill(col, 50);
    }
    ellipse(handleX, handleY, 40, 40);

    textAlign(CENTER, CENTER);
    textSize(10); fill(col, 150); noStroke();
    text("MOVE", drawBaseX, drawBaseY - 90);

    // Stats
    textAlign(LEFT); textSize(18);
    text("SYNC_RATE: " + floor(score) + "%", -width * 0.45, -height * 0.45);

    if (weaponTimer > 0) {
        fill(255, 200, 0);
        text("WEAPON: " + weaponMode + " (" + ceil(weaponTimer / 60) + "s)", -width * 0.45, -height * 0.45 + 30);
    }

    // Dashboard Stats (Top Right)
    textAlign(RIGHT, TOP);
    fill(col, 150);
    text("DESTROYED: " + enemiesDefeated, width * 0.45, -height * 0.45);
    text("DAMAGE: " + totalDamageDealt, width * 0.45, -height * 0.45 + 25);
    text("BULLETS: " + totalBulletsFired, width * 0.45, -height * 0.45 + 50);
    text("LIVING: " + particles.length, width * 0.45, -height * 0.45 + 75);

    drawingContext.enable(drawingContext.DEPTH_TEST);
    pop();
}

function triggerHitEffect() {
    flashAlpha = 255;
    isInverted = !isInverted;
    env.play(noiseOsc);
    score = max(0, score - 10);
    triggerGlitch(0.5);
    if (navigator.vibrate) navigator.vibrate(50);
}

function triggerGlitch(intensity) {
    glitchIntensity = max(glitchIntensity, intensity);
}

function drawGlitch() {
    push();
    resetMatrix();
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, -1000, 1000);
    noStroke();

    let count = floor(glitchIntensity * 20);
    for (let i = 0; i < count; i++) {
        let x = random(-width / 2, width / 2);
        let y = random(-height / 2, height / 2);
        let w = random(100, 400);
        let h = random(2, 20);

        // Glitch colors: Cyan, Magenta, White
        let r = random();
        if (r < 0.33) fill(0, 255, 255, 150);
        else if (r < 0.66) fill(255, 0, 255, 150);
        else fill(255, 255, 255, 180);

        rect(x, y, w, h);
    }

    // Slight shift effect
    if (random() < glitchIntensity) {
        fill(255, 50);
        rect(-width / 2, random(-height / 2, height / 2), width, 1);
    }

    pop();
}

function drawFlash() {
    push(); resetMatrix();
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    noStroke(); fill(isInverted ? 255 : 0, flashAlpha);
    plane(width, height);
    flashAlpha -= 20;
    pop();
}

function drawStartScreen() {
    push();
    resetMatrix();
    // 2D Ortho view centered
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);

    background(0);

    // Render Particles if ready
    if (titleParticles.length > 0) {
        for (let p of titleParticles) {
            p.behaviors();
            p.update();
            p.display();
        }
    } else {
        // FALLBACK: Static Text
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(60);
        if (myFont) textFont(myFont); else textFont('Courier New');
        text("Flock Shooting", 0, 0);
    }

    // Subtext
    if (myFont) textFont(myFont); else textFont('Courier New');
    textAlign(CENTER, CENTER);
    fill(150);
    textSize(18);
    text("CLICK OR PRESS KEY TO BOOT", 0, 100);

    pop();
}

function mousePressed() {
    if (gameState === "START") {
        userStartAudio(); gameState = "PLAY";
    } else if (gameState === "GAMEOVER") {
        resetGame();
    }
}
function keyPressed() {
    if (gameState === "START") {
        mousePressed();
    } else if (gameState === "GAMEOVER") {
        resetGame();
    } else if (gameState === "PLAY") {

        // --- DEBUG: Press 'B' to spawn Boss ---
        if (key === 'b' || key === 'B') {
            if (!boss) {
                console.log("Debug: Spawning Boss...");
                boss = new Boss();
                isBossActive = true;

                // --- FIX: Prevent MidBoss from appearing ---
                midBoss = null;
                midBossDefeated = true; // Mark as "already defeated" so it doesn't spawn naturally
                if (midBossBgmOsc) midBossBgmOsc.amp(0);
                // -------------------------------------------

                obstacles = [];
            }
        }

        // --- DEBUG: Press 'M' to spawn Mid-Boss ---
        if (key === 'm' || key === 'M') {
            if (!midBoss && !boss) {
                console.log("Debug: Spawning Mid-Boss...");
                midBoss = new MidBoss();
                midBossDefeated = false;
                obstacles = [];
            }
        }

        // --- DEBUG: Press 'P' to Max Power ---
        if (key === 'p' || key === 'P') {
            console.log("Debug: Max Power!");
            weaponMode = 'LASER';
            weaponTimer = 3000; // ~50 seconds
            growFlock(30); // Add 30 drones
            // score += 1000; // REMOVED to prevent auto-spawning bosses
            if (typeof itemEnv !== 'undefined' && typeof osc !== 'undefined') {
                itemEnv.play(osc);
                osc.freq(880);
            }
        }
    }
}

function damageFlock(amount) {
    triggerHitEffect();
    addScreenShake(30);
    for (let i = 0; i < amount; i++) {
        if (particles.length > 1) {
            particles.pop();
        } else {
            gameState = "GAMEOVER";
            break;
        }
    }
}

function growFlock(amount) {
    for (let i = 0; i < amount; i++) {
        let p = new WireCross(false);
        p.pos = p5.Vector.add(leader.pos, p5.Vector.random3D().mult(50));
        particles.push(p);
    }
    score += amount;
}

function resetGame() {
    particles = [];
    items = [];
    obstacles = [];
    allDebris = [];
    enemyBullets = [];
    scenery = [];
    boss = null;
    isBossActive = false;
    score = 0;
    leaderHistory = [];
    weaponMode = 'NORMAL';
    weaponTimer = 0;
    enemiesDefeated = 0;
    totalDamageDealt = 0;
    totalBulletsFired = 0;
    floatingTexts = [];
    shakeMagnitude = 0;
    midBoss = null;
    midBossDefeated = false;
    bossDefeated = false;
    bossSpawnDelay = 0;
    totalDistance = 0;

    if (midBossBgmOsc) midBossBgmOsc.amp(0);
    setup();
    gameState = "PLAY";
}

function drawGameOverScreen() {
    push(); resetMatrix(); camera(0, 0, 500, 0, 0, 0, 0, 1, 0); ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    background(0);

    if (myFont) textFont(myFont); else textFont('Courier New');
    textAlign(CENTER, CENTER); fill(255);

    // Tighten spacing for Title
    drawingContext.letterSpacing = "-5px";
    textSize(40); text("GAME OVER", 0, -20);

    // Moderate spacing for details
    drawingContext.letterSpacing = "-2px";
    textSize(18); text("FINAL SYNC: " + floor(score) + "%", 0, 20);
    textSize(14); text("CLICK TO REBOOT", 0, 60);

    // Reset spacing
    drawingContext.letterSpacing = "0px";
    pop();
}

function getFlockDensity() {
    if (!leader || particles.length <= 1) return 0;
    let totalDist = 0;
    for (let p of particles) {
        if (p === leader) continue;
        totalDist += dist(leader.pos.x, leader.pos.y, leader.pos.z, p.pos.x, p.pos.y, p.pos.z);
    }
    return totalDist / (particles.length - 1);
}

function fire() {
    let flockSize = particles.length;
    let density = getFlockDensity();

    // Default Laser (Crit Mass)
    let isLaserCrit = (flockSize >= 10) && (density < 80);

    shotEnv.play(osc);

    if (weaponMode === 'LASER') {
        osc.freq(330);
        bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, createVector(0, 0, -60), 'LASER'));
        totalBulletsFired++;
    } else if (weaponMode === 'HOMING') {
        osc.freq(660);
        for (let i = -1; i <= 1; i++) {
            let v = createVector(i * 10, random(-5, 5), -30);
            bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, v, 'HOMING'));
            totalBulletsFired++;
        }
    } else {
        osc.freq(isLaserCrit ? 440 : 880);
        if (isLaserCrit) {
            bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, createVector(0, 0, -50), 'LASER'));
            totalBulletsFired++;
        } else {
            let spreadCount = 0;
            if (flockSize >= 30) spreadCount = 2;
            else if (flockSize >= 10) spreadCount = 1;

            for (let i = -spreadCount; i <= spreadCount; i++) {
                let v = createVector(i * 3, 0, -40);
                bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, v, 'NORMAL'));
                totalBulletsFired++;
            }
        }
    }
}

function mouseWheel(event) {
    // event.delta > 0 means scroll down -> Move Down (Positive Y)
    // event.delta < 0 means scroll up -> Move Up (Negative Y)
    wheelForceY += event.delta * 0.5;
    return false; // Prevent default browser scrolling
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateBounds();
    grid = new Grid();
}

function spawnExplosion(x, y, z) {
    // Spawn 30-50 particles for a big blast
    let count = floor(random(30, 50));
    for (let i = 0; i < count; i++) {
        allDebris.push(new Debris(x, y, z));
    }
}

function spawnDamageText(x, y, z, damage) {
    // 1. Randomize Spawn Position (Scatter)
    // This prevents numbers from stacking perfectly on top of each other
    let scatterX = random(-40, 40);
    let scatterY = random(-40, 40);
    let scatterZ = random(50, 150); // Push TOWARDS camera (Z+) to ensure it's in front of enemy

    // 2. Large Size
    let size = random(80, 120);
    let c = color(255); // White default

    if (damage > 1) {
        size = 180; // Critical
        c = color(255, 50, 50); // Red
        scatterZ += 100; // Pop out even more
    }

    // 3. Create Text
    let txt = new FloatingText(x + scatterX, y + scatterY, z + scatterZ, str(damage), size, c);

    // 4. Add initial explosive velocity for "Pop" feel
    txt.vel.add(p5.Vector.random3D().mult(5));

    floatingTexts.push(txt);
}

function addScreenShake(amount) {
    shakeMagnitude = max(shakeMagnitude, amount);
}

function hitSound() {
    shotEnv.setADSR(0.001, 0.05, 0, 0);
    shotEnv.play(osc);
    osc.freq(1200);
}

function destroySound() {
    env.setADSR(0.01, 0.3, 0, 0);
    env.play(noiseOsc);
    osc.freq(60);
    shotEnv.play(osc);
}

function enemyFireSound() {
    shotEnv.setADSR(0.01, 0.1, 0, 0);
    shotEnv.play(sawOsc);
    sawOsc.freq(150);
}