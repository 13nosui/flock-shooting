

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
let curCamX = 0;

let moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let osc, noiseOsc, env, shotEnv, itemEnv;
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

function preload() {
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
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

    for (let i = 0; i < NUM_PARTICLES; i++) {
        let p = new WireCross(i === 0);
        particles.push(p);
        if (i === 0) leader = p;
    }
    grid = new Grid();
    curCamX = 0;
}

function updateBounds() {
    boundsX = width / 2;
    boundsY = height / 2;
    boundsZ = 1000;
}

function isTouchingUI() {
    // Left Stick Zone
    let stickX = width * 0.15;
    let stickY = height - 100;
    if (dist(mouseX, mouseY, stickX, stickY) < 100) return true;

    // Right Slider Zone
    let sliderX = width * 0.85;
    let sliderY = height - 100;
    if (abs(mouseX - sliderX) < 40 && abs(mouseY - sliderY) < 100) return true;

    return false;
}

function draw() {
    background(isInverted ? 255 : 0);

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
    let camY = -1200; // Fixed high altitude
    let camZ = leader.pos.z + 800; // Keep distance behind

    // Look slightly ahead of the leader
    let lookX = leader.pos.x * 0.2;
    let lookY = 0;
    let lookZ = leader.pos.z - 500;

    camera(curCamX, camY, camZ, lookX, lookY, lookZ, 0, 1, 0);

    // Sync grid speed with leader's forward velocity
    let forwardSpeed = 15 - leader.vel.z;
    grid.update(forwardSpeed);
    grid.display();

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

                if (isDestroyed) {
                    // Death Logic
                    let dropType = o.getDropItemType();
                    items.push(new Item(o.pos.x, o.pos.y, o.pos.z, dropType));
                    spawnExplosion(o.pos.x, o.pos.y, o.pos.z);
                    triggerHitEffect();
                }

                if (!b.penetrate) {
                    b.active = false;
                }
                break;
            }
        }

        if (!bullets[i].active) bullets.splice(i, 1);
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

    if (frameCount % spawnInterval === 0) obstacles.push(new VoxelObstacle(difficulty));
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].display();

        // Leader hit obstacle
        let d = dist(obstacles[i].pos.x, obstacles[i].pos.y, obstacles[i].pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (obstacles[i].active && !obstacles[i].isHit && d < obstacles[i].size / 2 + 30) {
            obstacles[i].isHit = true;
            damageFlock(5);
            obstacles[i].active = false;
        }

        if (!obstacles[i].active) obstacles.splice(i, 1);
    }

    for (let i = allDebris.length - 1; i >= 0; i--) {
        allDebris[i].update();
        allDebris[i].display();
        if (allDebris[i].life <= 0) allDebris.splice(i, 1);
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
}

function handleInput() {
    let wind = createVector(0, 0, 0);
    let power = 5.0;

    // Keyboard Fallback (WASD + QE/ShiftSpace)
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) wind.x = -power; // A
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) wind.x = power;  // D
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) wind.z = -power; // W (Forward = -Z)
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) wind.z = power;  // S (Backward = +Z)
    if (keyIsDown(81) || keyIsDown(SHIFT)) wind.y = -power; // Q (Ascend = -Y)
    if (keyIsDown(69) || keyIsDown(32)) wind.y = power;  // E (Descend = +Y)

    // Dual-Stick Mouse/Touch Logic
    if (mouseIsPressed) {
        // Left Stick (Movement on X-Z Plane)
        if (mouseX < width * 0.4) {
            let stickCenterX = width * 0.15;
            let stickCenterY = height - 100;
            let dx = mouseX - stickCenterX;
            let dy = mouseY - stickCenterY;
            let d = dist(mouseX, mouseY, stickCenterX, stickCenterY);
            let maxR = 80;
            if (d > 5) {
                let r = min(d, maxR);
                let angle = atan2(dy, dx);
                wind.x = map(r * cos(angle), -maxR, maxR, -power, power);
                wind.z = map(r * sin(angle), -maxR, maxR, -power, power);
            }
        }
        // Right Slider (Altitude on Y Axis)
        if (mouseX > width * 0.6) {
            let sliderCenterX = width * 0.85;
            let sliderCenterY = height - 100;
            let dy = mouseY - sliderCenterY;
            if (abs(dy) > 10) {
                wind.y = map(constrain(dy, -80, 80), -80, 80, -power, power);
            }
        }
    }

    if (leader && leader.applyForce) {
        // Apply wheel force
        wind.y += wheelForceY;
        // Decay the wheel force (friction)
        wheelForceY *= 0.9;
        if (abs(wheelForceY) < 0.1) wheelForceY = 0;

        leader.applyForce(wind);
    }

    if (wind.mag() > 0) {
        osc.freq(120 + leader.vel.mag() * 5, 0.1);
        osc.amp(0.08, 0.1);
    } else {
        osc.amp(0, 0.2);
    }

    // Auto-Fire Logic
    if (gameState === "PLAY") {
        if ((mouseIsPressed && !isTouchingUI()) || keyIsDown(32)) {
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
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    drawingContext.disable(drawingContext.DEPTH_TEST);
    textFont(myFont);

    let col = isInverted ? 0 : 255;
    stroke(col, 150);
    noFill();

    // Left Stick (X-Z Plane)
    let stickX = -width * 0.35;
    let stickY = height * 0.35;
    ellipse(stickX, stickY, 160, 160);

    // Stick Handle
    let handleX = stickX;
    let handleY = stickY;
    if (mouseIsPressed && mouseX < width * 0.4) {
        let dx = mouseX - width * 0.15;
        let dy = mouseY - (height - 100);
        let d = dist(0, 0, dx, dy);
        let r = min(d, 80);
        let angle = atan2(dy, dx);
        handleX += cos(angle) * r;
        handleY += sin(angle) * r;
    }
    ellipse(handleX, handleY, 40, 40);

    textAlign(CENTER, CENTER);
    textSize(10); fill(col, 150); noStroke();
    text("MOVE", stickX, stickY - 80);
    text("FWD", stickX, stickY - 45);
    text("BWD", stickX, stickY + 45);
    text("L", stickX - 45, stickY);
    text("R", stickX + 45, stickY);

    // Right Slider (Y Altitude)
    let sliderX = width * 0.35;
    let sliderY = height * 0.35;
    noFill(); stroke(col, 150);
    rect(sliderX - 20, sliderY - 80, 40, 160, 10);

    // Slider Handle
    let shY = sliderY;
    if (mouseIsPressed && mouseX > width * 0.6) {
        shY = sliderY + constrain(mouseY - (height - 100), -80, 80);
    }
    fill(col, 150);
    rect(sliderX - 25, shY - 10, 50, 20, 5);

    noStroke();
    text("ALTITUDE", sliderX, sliderY - 80);
    text("UP", sliderX, sliderY - 40);
    text("DOWN", sliderX, sliderY + 40);

    // Stats
    textAlign(LEFT); textSize(18);
    text("SYNC_RATE: " + floor(score) + "%", -width * 0.45, -height * 0.45);

    if (weaponTimer > 0) {
        fill(255, 200, 0);
        text("WEAPON: " + weaponMode + " (" + ceil(weaponTimer / 60) + "s)", -width * 0.45, -height * 0.45 + 30);
    }

    drawingContext.enable(drawingContext.DEPTH_TEST);
    pop();
}

function triggerHitEffect() {
    flashAlpha = 255;
    isInverted = !isInverted;
    env.play(noiseOsc);
    score = max(0, score - 10);
    if (navigator.vibrate) navigator.vibrate(50);
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
    push(); resetMatrix(); camera(0, 0, 500, 0, 0, 0, 0, 1, 0); ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    background(0); textFont(myFont); textAlign(CENTER, CENTER); fill(255);
    textSize(40); text("THA_GUNTAI", 0, -20);
    textSize(18); text("CLICK OR PRESS KEY TO BOOT", 0, 50);
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
    }
}

function damageFlock(amount) {
    triggerHitEffect();
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
    score = 0;
    leaderHistory = [];
    weaponMode = 'NORMAL';
    weaponTimer = 0;
    setup();
    gameState = "PLAY";
}

function drawGameOverScreen() {
    push(); resetMatrix(); camera(0, 0, 500, 0, 0, 0, 0, 1, 0); ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    background(0); textFont(myFont); textAlign(CENTER, CENTER); fill(255);
    textSize(40); text("GAME OVER", 0, -20);
    textSize(18); text("FINAL SYNC: " + floor(score) + "%", 0, 20);
    textSize(14); text("CLICK TO REBOOT", 0, 60);
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
    } else if (weaponMode === 'HOMING') {
        osc.freq(660);
        for (let i = -1; i <= 1; i++) {
            let v = createVector(i * 10, random(-5, 5), -30);
            bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, v, 'HOMING'));
        }
    } else {
        osc.freq(isLaserCrit ? 440 : 880);
        if (isLaserCrit) {
            bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, createVector(0, 0, -50), 'LASER'));
        } else {
            let spreadCount = 0;
            if (flockSize >= 30) spreadCount = 2;
            else if (flockSize >= 10) spreadCount = 1;

            for (let i = -spreadCount; i <= spreadCount; i++) {
                let v = createVector(i * 3, 0, -40);
                bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, v, 'NORMAL'));
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