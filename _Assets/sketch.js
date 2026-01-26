// ライブラリを動的に読み込む
let script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js';
document.head.appendChild(script);

let particles = [];
const NUM_PARTICLES = 800;
let leader;
let boundsX, boundsY, boundsZ;
let flashAlpha = 0;
let started = false;

// 進行管理
let hitCount = 0;
let totalHitCount = 0;
let behaviorMode = 0;
let isInverted = false;
const MODE_MAX = 3;
const HITS_TO_CHANGE = 3;
const HITS_FOR_BONUS = 15;

// ボーナス演出用
let bonusTimer = 0;
const BONUS_DURATION = 120; // 2秒間 (60fps想定)
let pg;

// カメラ制御
let curCamPos, tgtCamPos;
let curCamLook, tgtCamLook;

// 音響
let osc, env;
let noiseOsc;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    pixelDensity(1);
    setAttributes('antialias', false);

    updateBounds();

    pg = createGraphics(windowWidth, windowHeight);
    pg.textFont('monospace');
    pg.textAlign(CENTER, CENTER);

    curCamPos = createVector(0, 0, 1000);
    tgtCamPos = createVector(0, 0, 1000);
    curCamLook = createVector(0, 0, 0);
    tgtCamLook = createVector(0, 0, 0);

    osc = new p5.Oscillator('sine');
    env = new p5.Envelope();
    env.setADSR(0.001, 0.05, 0, 0);
    env.setRange(0.5, 0);

    noiseOsc = new p5.Oscillator('square');
    noiseOsc.amp(0);

    for (let i = 0; i < NUM_PARTICLES; i++) {
        let p = new WireCross(i === 0);
        particles.push(p);
        if (i === 0) leader = p;
    }
}

function updateBounds() {
    boundsX = width / 2;
    boundsY = height / 2;
    boundsZ = 600;
}

function draw() {
    if (!started) {
        background(0);
        return;
    }

    let bgColor = isInverted ? 255 : 0;
    background(bgColor);

    // フラッシュ
    let flashColor = isInverted ? 0 : 255;
    if (flashAlpha > 0) {
        push();
        resetMatrix();
        noStroke();
        fill(flashColor, flashAlpha);
        plane(width * 2, height * 2);
        pop();
        flashAlpha -= 40;
    }

    // メインカメラ更新
    updateCameraTarget();
    curCamPos = p5.Vector.lerp(curCamPos, tgtCamPos, 0.05);
    curCamLook = p5.Vector.lerp(curCamLook, tgtCamLook, 0.05);
    camera(curCamPos.x, curCamPos.y, curCamPos.z, curCamLook.x, curCamLook.y, curCamLook.z, 0, 1, 0);

    leader.updateAsLeader();

    for (let p of particles) {
        if (!p.isLeader) p.flock(particles, leader.pos);
        p.update();
        p.display();
    }

    // --- ボーナス演出 ---
    if (bonusTimer > 0) {
        drawBonusEffect();
        bonusTimer--;
        if (bonusTimer === 0) {
            noiseOsc.amp(0, 0.1);
        }
    }
}

function drawBonusEffect() {
    // 1. タイポグラフィ描画 (背景を不透明にして背後を隠す)
    pg.background(isInverted ? 0 : 255);
    pg.fill(isInverted ? 255 : 0);
    pg.noStroke();
    let gridSize = 60;
    pg.textSize(40);
    for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
            let char = random(['0', '1', 'X', '+', '-', '#', '$', ' ']);
            if (random() > 0.9) char = floor(random(100));
            pg.text(char, x + gridSize / 2, y + gridSize / 2);
        }
    }

    // 2. 加速度ズームの計算
    // bonusTimerは120から0に減るため、経過時間を算出
    let elapsed = BONUS_DURATION - bonusTimer;
    // 指数・べき乗を使って後半になるほど激しくズームさせる
    let zoom = 1.0 + pow(elapsed * 0.06, 3);

    push();
    resetMatrix();
    // 正面固定カメラ
    camera(0, 0, 500, 0, 0, 0, 0, 1, 0);
    ortho(-width / 2, width / 2, -height / 2, height / 2, 0, 2000);
    drawingContext.disable(drawingContext.DEPTH_TEST);

    // ズーム適用
    scale(zoom);
    noStroke();
    texture(pg);
    plane(width, height);

    drawingContext.enable(drawingContext.DEPTH_TEST);
    pop();

    // 3. 音響：グリッチノイズ
    noiseOsc.freq(random(50, 5000));
    noiseOsc.amp(random(0.05, 0.15));
}

function updateCameraTarget() {
    let t = frameCount * 0.01;
    if (behaviorMode === 0) {
        tgtCamPos.set(sin(t) * 1000, cos(t * 0.5) * 400, 1200);
        tgtCamLook.set(0, 0, 0);
    } else if (behaviorMode === 1) {
        tgtCamPos.set(sin(t * 2) * 200, -1400, cos(t * 2) * 200);
        tgtCamLook.set(leader.pos.x * 0.5, 0, leader.pos.z * 0.5);
    } else if (behaviorMode === 2) {
        tgtCamPos.set(1000, -800, 1000);
        tgtCamLook.set(0, 0, 0);
    }
}

function mousePressed() {
    if (!started) {
        userStartAudio();
        osc.start();
        osc.amp(0);
        noiseOsc.start();
        noiseOsc.amp(0);
        started = true;
        triggerHitEffect();
    }
}

function triggerHitEffect() {
    flashAlpha = 255;
    hitCount++;
    totalHitCount++;

    if (totalHitCount % HITS_FOR_BONUS === 0) {
        bonusTimer = BONUS_DURATION;
        osc.freq(40);
    }

    if (hitCount >= HITS_TO_CHANGE) {
        hitCount = 0;
        behaviorMode = (behaviorMode + 1) % MODE_MAX;
        isInverted = !isInverted;

        if (bonusTimer <= 0) {
            if (behaviorMode === 0) osc.freq(880);
            if (behaviorMode === 1) osc.freq(1760);
            if (behaviorMode === 2) osc.freq(220);
        }
    } else if (bonusTimer <= 0) {
        osc.freq(random(800, 1200));
    }

    env.play(osc);

    if (navigator.vibrate) {
        navigator.vibrate(bonusTimer > 0 ? 150 : 15);
    }
}

class WireCross {
    constructor(isLeader) {
        this.isLeader = isLeader;
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), random(-boundsZ, boundsZ));
        this.vel = p5.Vector.random3D();
        this.acc = createVector(0, 0, 0);
        this.baseMaxSpeed = isLeader ? 35 : random(18, 28);
        this.baseMaxForce = isLeader ? 3.0 : 1.5;
        this.size = isLeader ? 10 : 6;
    }

    update() {
        // ボーナス中は2.5倍速
        let multiplier = (bonusTimer > 0) ? 2.5 : 1.0;
        let currentMaxSpeed = this.baseMaxSpeed * multiplier;
        let currentMaxForce = this.baseMaxForce * multiplier;

        this.vel.add(this.acc);
        this.vel.limit(currentMaxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);

        let bX = boundsX, bY = boundsY, bZ = boundsZ;
        let hit = false;
        if (abs(this.pos.x) > bX) { this.vel.x *= -1; this.pos.x = constrain(this.pos.x, -bX, bX); hit = true; }
        if (abs(this.pos.y) > bY) { this.vel.y *= -1; this.pos.y = constrain(this.pos.y, -bY, bY); hit = true; }
        if (abs(this.pos.z) > bZ) { this.vel.z *= -1; this.pos.z = constrain(this.pos.z, -bZ, bZ); hit = true; }

        if (this.isLeader && hit) {
            triggerHitEffect();
        }
    }

    updateAsLeader() {
        let multiplier = (bonusTimer > 0) ? 3.0 : 1.0;
        let currentMaxForce = this.baseMaxForce * multiplier;

        let noiseTarget = createVector(
            noise(frameCount * 0.02) * width - width / 2,
            noise(frameCount * 0.02 + 1000) * height - height / 2,
            noise(frameCount * 0.01 + 2000) * boundsZ * 2 - boundsZ
        );
        let steer = p5.Vector.sub(noiseTarget, this.pos);
        steer.limit(currentMaxForce);
        this.acc.add(steer);
    }

    flock(agents, leaderTarget) {
        let multiplier = (bonusTimer > 0) ? 2.0 : 1.0;
        let currentMaxSpeed = this.baseMaxSpeed * multiplier;
        let currentMaxForce = this.baseMaxForce * multiplier;

        if (behaviorMode === 0) {
            let sep = createVector(0, 0, 0);
            let ali = createVector(0, 0, 0);
            let count = 0;
            let myIdx = agents.indexOf(this);
            for (let i = 1; i < 8; i++) {
                let other = agents[(myIdx + i) % agents.length];
                let dSq = p5.Vector.sub(this.pos, other.pos).magSq();
                if (dSq > 0 && dSq < 1600) {
                    let diff = p5.Vector.sub(this.pos, other.pos);
                    diff.normalize().div(sqrt(dSq));
                    sep.add(diff);
                    ali.add(other.vel);
                    count++;
                }
            }
            if (count > 0) {
                sep.div(count).setMag(currentMaxSpeed).sub(this.vel).limit(currentMaxForce);
                ali.div(count).setMag(currentMaxSpeed).sub(this.vel).limit(currentMaxForce * 0.5);
            }
            let follow = p5.Vector.sub(leaderTarget, this.pos);
            follow.setMag(currentMaxSpeed);
            let steerFollow = p5.Vector.sub(follow, this.vel);
            steerFollow.limit(currentMaxForce * 0.8);
            this.acc.add(sep.mult(3.5));
            this.acc.add(ali);
            this.acc.add(steerFollow);

        } else if (behaviorMode === 1) {
            let desired = p5.Vector.sub(leaderTarget, this.pos);
            let d = desired.mag();
            let orbit = createVector(-desired.y, desired.x, desired.z * 0.1);
            orbit.setMag(currentMaxSpeed * 1.3);
            if (d > 250) orbit.add(desired.setMag(currentMaxSpeed));
            let steer = p5.Vector.sub(orbit, this.vel);
            steer.limit(currentMaxForce * 1.5);
            this.acc.add(steer);

        } else if (behaviorMode === 2) {
            let gridSize = 120;
            let targetPos = createVector(
                round(this.pos.x / gridSize) * gridSize,
                round(this.pos.y / gridSize) * gridSize,
                round(this.pos.z / gridSize) * gridSize
            );
            let steer = p5.Vector.sub(targetPos, this.pos);
            steer.mult(0.25);
            steer.limit(currentMaxForce * 0.8);
            this.acc.add(steer);
            this.vel.mult(0.85);
        }
    }

    display() {
        let d = dist(this.pos.x, this.pos.y, this.pos.z, 0, 0, 800);
        let primaryColor = isInverted ? 0 : 255;
        let secondaryColor = isInverted ? 200 : 50;
        let brightness = this.isLeader ? primaryColor : map(d, 0, 2000, primaryColor, secondaryColor);

        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        let v = this.vel;
        rotateY(atan2(v.x, v.z));
        rotateX(-asin(v.y / (v.mag() + 0.1)));

        if (this.isLeader) {
            let leaderRed = isInverted ? '#CC0000' : '#FF0000';
            stroke(flashAlpha > 127 ? primaryColor : leaderRed);
            strokeWeight(2);
        } else {
            stroke(brightness);
            strokeWeight(behaviorMode === 2 ? 2 : 1);
        }

        let s = this.size;
        if (behaviorMode === 2 && !this.isLeader) {
            point(0, 0);
        } else {
            line(-s * 1.5, 0, 0, s * 1.5, 0, 0);
            line(0, -s, -s * 0.5, 0, s, -s * 0.5);
        }
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    pg.resizeCanvas(windowWidth, windowHeight);
    updateBounds();
}