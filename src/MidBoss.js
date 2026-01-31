class MidBoss {
    constructor(phase = 1) {
        this.phase = phase;

        // --- UPDATED: Spawn Relative to Player ---
        let startX = 0;
        let startZ = -4000;
        if (typeof leader !== 'undefined' && leader) {
            startX = leader.pos.x;
            startZ = leader.pos.z - 3000; // Spawn 3000 units ahead
        }
        this.pos = createVector(startX, 0, startZ);
        // -----------------------------------------

        // Scale HP
        this.hp = 70 + (this.phase - 1) * 50;
        this.maxHp = this.hp;

        this.active = true;
        this.fireTimer = 0;
        this.shakeTimer = 0;
    }

    update() {
        let targetX = 0;
        let targetZ = -1200;

        // --- UPDATED: Track Player Position ---
        if (typeof leader !== 'undefined' && leader) {
            // Stay 1200 units ahead of player
            targetZ = leader.pos.z - 1200;
            targetX = leader.pos.x;
        }

        // Approach Z (Smooth fly-in)
        if (this.pos.z < targetZ) {
            this.pos.z += 15; // Fly in speed
        } else {
            // Keep pace if player pushes forward, or hold relative pos
            this.pos.z = lerp(this.pos.z, targetZ, 0.1);
        }

        // Match X with Hover
        this.pos.x = targetX + sin(frameCount * 0.02) * 300;

        // Lock Y
        this.pos.y = 0;
        // --------------------------------------

        // Attack Frequency
        this.fireTimer++;
        let threshold = max(40, 80 - (this.phase * 5));
        if (this.fireTimer > threshold) {
            this.fire();
            this.fireTimer = 0;
        }
    }

    fire() {
        let target = createVector(0, 0, 500);
        if (typeof leader !== 'undefined') target = leader.pos.copy();

        let dir = p5.Vector.sub(target, this.pos);
        let speed = 20 + (this.phase * 2);

        // Phase 1: 3-way, Phase 2+: 5-way
        let angles = (this.phase > 1) ? [-0.4, -0.2, 0, 0.2, 0.4] : [-0.2, 0, 0.2];

        for (let angle of angles) {
            let d = dir.copy();
            // Rotate around Y axis logic
            let ang = atan2(d.x, d.z) + angle;
            d.x = sin(ang) * d.mag();
            d.z = cos(ang) * d.mag();

            d.setMag(speed);
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 100, d, 'ENEMY'));
            }
        }
        if (typeof enemyFireSound === 'function') enemyFireSound();
    }

    display() {
        push();
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-15, 15); shakeY = random(-15, 15); shakeZ = random(-15, 15);
            this.shakeTimer--;
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);

        if (this.phase > 1) {
            stroke(255, 150, 0); strokeWeight(3);
        } else {
            stroke(100, 255, 100); strokeWeight(2);
        }

        noFill();

        // Head
        push(); translate(0, -30, 80); box(50, 40, 50); pop();
        // Body
        box(80, 60, 100);
        // Tail
        push(); translate(0, 10, -100); rotateX(-0.2); box(70, 50, 120); pop();

        // Wings
        let flap = sin(frameCount * 0.8) * 0.5;
        push(); translate(-40, -30, 20); rotateZ(-flap + 0.5);
        fill(this.phase > 1 ? color(255, 100, 0, 50) : color(100, 255, 100, 30));
        box(180, 10, 80); pop();

        push(); translate(40, -30, 20); rotateZ(flap - 0.5);
        fill(this.phase > 1 ? color(255, 100, 0, 50) : color(100, 255, 100, 30));
        box(180, 10, 80); pop();

        if (this.phase > 1) {
            push(); translate(0, -50, 0); rotateX(PI / 4); box(20, 80, 20); pop();
        }

        // HP Bar
        push(); translate(0, -150, 0);
        rotateY(PI);
        noStroke(); fill(50); rect(-60, -5, 120, 10);
        fill(255, 50, 50);
        let hpW = map(this.hp, 0, this.maxHp, 0, 120);
        rect(-60, -5, hpW, 10);
        stroke(255); noFill(); rect(-60, -5, 120, 10);
        pop();

        pop();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 20;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }
}
