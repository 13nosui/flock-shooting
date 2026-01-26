let script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js';
document.head.appendChild(script);

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

let moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let osc, noiseOsc, env;

function preload() {
    myFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    updateBounds();

    osc = new p5.Oscillator('sine');
    noiseOsc = new p5.Oscillator('white');
    env = new p5.Envelope();
    env.setADSR(0.01, 0.1, 0, 0);

    noiseOsc.amp(0);
    noiseOsc.start();
    osc.amp(0);
    osc.start();

    for (let i = 0; i < NUM_PARTICLES; i++) {
        let p = new WireCross(i === 0);
        particles.push(p);
        if (i === 0) leader = p;
    }
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
    let camZ = 1000; // 少しカメラを引き、広がりを見せる
    camera(leader.pos.x * 0.5, leader.pos.y * 0.5, camZ, leader.pos.x * 0.5, leader.pos.y * 0.5, 0, 0, 1, 0);

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
    moveLeft = false; moveRight = false; moveUp = false; moveDown = false;
    let wind = createVector(0, 0, 0);
    let power = 5.0;

    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { wind.x = -power; moveLeft = true; }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { wind.x = power; moveRight = true; }
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { wind.y = -power; moveUp = true; }
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { wind.y = power; moveDown = true; }

    if (mouseIsPressed && mouseY > height * 0.5) {
        if (mouseX < width * 0.3) { wind.x = -power; moveLeft = true; }
        else if (mouseX > width * 0.7) { wind.x = power; moveRight = true; }
        else {
            if (mouseY < height * 0.75) { wind.y = -power; moveUp = true; }
            else { wind.y = power; moveDown = true; }
        }
    }

    // エラー箇所修正：leaderが存在し、applyForceメソッドがあるか確認
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

class WireCross {
    constructor(isLeader) {
        this.isLeader = isLeader;
        this.pos = createVector(random(-200, 200), random(-200, 200), random(-100, 100));
        this.vel = createVector(0, 0, 0);
        this.acc = createVector(0, 0, 0);
        this.size = isLeader ? 40 : 15;
        // 各個体に固有のオフセット（目標地点のバラツキ）を与える
        this.offset = p5.Vector.random3D().mult(random(30, 150));
        if (isLeader) this.offset.mult(0);
    }

    // エラー修正：メソッドをクラス内に定義
    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.isLeader ? 45 : 32);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.9); // 慣性

        this.pos.x = constrain(this.pos.x, -boundsX * 1.8, boundsX * 1.8);
        this.pos.y = constrain(this.pos.y, -boundsY * 1.8, boundsY * 1.8);
    }

    updateAsLeader() {
        score += 0.05;
    }

    flock(agents, target) {
        // 目標地点をオフセットで散らす
        let targetWithOffset = p5.Vector.add(target, this.offset);
        let steer = p5.Vector.sub(targetWithOffset, this.pos);
        let d = steer.mag();

        if (d > 0) {
            let strength = map(d, 0, 600, 0.1, 4.0);
            steer.setMag(strength);
            this.acc.add(steer);
        }

        // 分離力（重なり防止）
        let sep = createVector(0, 0, 0);
        let count = 0;
        let myIdx = agents.indexOf(this);
        for (let i = 1; i < 7; i++) {
            let other = agents[(myIdx + i) % agents.length];
            let distToOther = p5.Vector.dist(this.pos, other.pos);
            if (distToOther > 1 && distToOther < 80) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize().div(distToOther);
                sep.add(diff);
                count++;
            }
        }
        if (count > 0) {
            sep.setMag(3.5);
            this.acc.add(sep);
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        strokeWeight(this.isLeader ? 4 : 2);
        stroke(this.isLeader ? '#FF0000' : (isInverted ? 0 : 255));
        let s = this.size;
        line(-s, 0, 0, s, 0, 0);
        line(0, -s, 0, 0, s, 0);
        pop();
    }
}

class VoxelObstacle {
    constructor() {
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        this.size = random(180, 350);
        this.speed = 22;
        this.active = true;
        this.isHit = false;
    }
    update() {
        this.pos.z += this.speed;
        if (this.pos.z > 1000) this.active = false;
        let d = dist(this.pos.x, this.pos.y, this.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (!this.isHit && d < this.size / 2 + 20) {
            this.isHit = true;
            triggerHitEffect();
        }
    }
    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        stroke(isInverted ? 0 : 255, 120);
        noFill();
        box(this.size);
        pop();
    }
}

function drawUI() {
    push();
    resetMatrix();
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 1000);
    drawingContext.disable(drawingContext.DEPTH_TEST);
    textFont(myFont);
    textAlign(CENTER, CENTER);
    let txtColor = isInverted ? 0 : 255;
    textSize(32);
    fill(moveLeft ? '#FF0000' : txtColor); text("LEFT", -width * 0.35, height * 0.35);
    fill(moveRight ? '#FF0000' : txtColor); text("RIGHT", width * 0.35, height * 0.35);
    fill(moveUp ? '#FF0000' : txtColor); text("UP", 0, height * 0.28);
    fill(moveDown ? '#FF0000' : txtColor); text("DOWN", 0, height * 0.42);
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

function mousePressed() { if (!started) { userStartAudio(); started = true; } }
function keyPressed() { if (!started) mousePressed(); }