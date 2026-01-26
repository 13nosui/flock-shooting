

let particles = [];
const NUM_PARTICLES = 300;
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
let osc, noiseOsc, env, shotEnv;

function preload() {
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    updateBounds();

    osc = new p5.Oscillator('sine');
    noiseOsc = new p5.Noise('white');
    env = new p5.Envelope();
    env.setADSR(0.01, 0.1, 0, 0);

    shotEnv = new p5.Envelope();
    shotEnv.setADSR(0.001, 0.05, 0, 0);

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

function draw() {
    background(isInverted ? 255 : 0);

    if (!started) {
        drawStartScreen();
        return;
    }

    handleInput();

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
                o.active = false;
                b.active = false;
                triggerHitEffect();
                break;
            }
        }

        if (!bullets[i].active) bullets.splice(i, 1);
    }

    if (frameCount % 60 === 0) obstacles.push(new VoxelObstacle());
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].display();
        if (!obstacles[i].active) obstacles.splice(i, 1);
    }

    leader.updateAsLeader();
    for (let p of particles) {
        if (!p.isLeader) p.flock(particles, leader.pos);
        p.update();
        p.display();
    }
    pop();

    drawUI();
    if (flashAlpha > 0) drawFlash();
}

function handleInput() {
    let wind = createVector(0, 0, 0);
    let power = 5.0;

    // Keyboard X/Z (Forward/Backward/Left/Right)
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) wind.x = -power;
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) wind.x = power;
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) wind.z = -power;
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) wind.z = power;

    // Keyboard Y (Altitude)
    if (keyIsDown(SHIFT) || keyIsDown(81)) wind.y = -power; // UP
    if (keyIsDown(32) || keyIsDown(69)) wind.y = power;    // DOWN (Space or E)

    // Virtual Joystick / Slider Logic
    if (mouseIsPressed) {
        // Left zone: Joystick (Movement on X-Z plane)
        if (mouseX < width * 0.5) {
            let joyX = width * 0.2;
            let joyY = height - 120;
            let dx = mouseX - joyX;
            let dy = mouseY - joyY;
            let d = dist(mouseX, mouseY, joyX, joyY);
            let angle = atan2(dy, dx);
            let dist_val = min(d, 60);
            wind.x = map(dist_val * cos(angle), -60, 60, -power, power);
            wind.z = map(dist_val * sin(angle), -60, 60, -power, power);
        }
        // Right zone: Altitude Control (Movement on Y axis)
        if (mouseX > width * 0.6) {
            let sliderY = height - 120;
            if (mouseY < sliderY - 20) wind.y = -power;
            else if (mouseY > sliderY + 20) wind.y = power;
        }
    }

    if (leader && leader.applyForce) {
        leader.applyForce(wind);
    }

    if (wind.mag() > 0) {
        osc.freq(120 + leader.vel.mag() * 5, 0.1);
        osc.amp(0.08, 0.1);
    } else {
        osc.amp(0, 0.2);
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

    // Bottom-Left: Virtual Joystick (X-Z)
    let joyX = -width * 0.3;
    let joyY = height * 0.35;
    strokeWeight(1);
    ellipse(joyX, joyY, 120, 120);
    line(joyX - 10, joyY, joyX + 10, joyY);
    line(joyX, joyY - 10, joyX, joyY + 10);

    // Stick visualization
    if (mouseIsPressed && mouseX < width * 0.5) {
        let dx = mouseX - width * 0.2;
        let dy = mouseY - (height - 120);
        let d = dist(0, 0, dx, dy);
        let angle = atan2(dy, dx);
        let r = min(d, 60);
        ellipse(joyX + cos(angle) * r, joyY + sin(angle) * r, 30, 30);
    } else {
        ellipse(joyX, joyY, 30, 30);
    }

    textAlign(CENTER, CENTER);
    textSize(10);
    fill(col, 150); noStroke();
    text("MOVE", joyX, joyY - 75);
    text("FWD", joyX, joyY - 45);
    text("BWD", joyX, joyY + 45);
    text("L", joyX - 45, joyY);
    text("R", joyX + 45, joyY);

    // Bottom-Right: Altitude Control (Y)
    let altX = width * 0.3;
    let altY = height * 0.35;
    noFill(); stroke(col, 150);
    rect(altX - 25, altY - 60, 50, 120);
    line(altX - 25, altY, altX + 25, altY);

    fill(col, 150); noStroke();
    text("ALTITUDE", altX, altY - 75);
    text("UP", altX, altY - 40);
    text("DOWN", altX, altY + 40);

    // Stats
    textAlign(LEFT); textSize(18);
    text("SYNC_RATE: " + floor(score) + "%", -width * 0.45, -height * 0.45);

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
    if (!started) {
        userStartAudio(); started = true;
    } else {
        fire();
    }
}
function keyPressed() {
    if (!started) {
        mousePressed();
    } else if (key === ' ') {
        fire();
    }
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
    let density = getFlockDensity();
    let isLaser = density < 80;

    shotEnv.play(osc);
    osc.freq(isLaser ? 440 : 880);

    if (isLaser) {
        bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, createVector(0, 0, -50), true));
    } else {
        for (let i = -2; i <= 2; i++) {
            let v = createVector(i * 2, 0, -40);
            bullets.push(new Bullet(leader.pos.x, leader.pos.y, leader.pos.z, v, false));
        }
    }
}