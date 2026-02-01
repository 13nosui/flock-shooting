class Boss {
    constructor(phase = 1) {
        this.phase = phase;

        // --- FIX: Spawn Relative to Player ---
        let startX = 0;
        let startZ = -5000;

        // If leader exists, spawn ahead of them
        if (typeof leader !== 'undefined' && leader) {
            startX = leader.pos.x;
            startZ = leader.pos.z - 4000; // Spawn 4000 units "forward" (Negative Z)
        }

        this.pos = createVector(startX, 0, startZ);
        // -------------------------------------

        // Massive HP Scaling
        this.coreHp = 300 + (this.phase - 1) * 200;
        this.maxCoreHp = this.coreHp;

        this.active = true;
        this.fireTimer = 0;
        this.wingAngle = 0;
        this.shakeTimer = 0;
    }

    update() {
        // --- FIX: Move Relative to Player ---
        let targetZ = -2000;
        let targetX = 0;

        if (typeof leader !== 'undefined' && leader) {
            targetZ = leader.pos.z - 2000; // Stay 2000 units ahead
            targetX = leader.pos.x;
        }

        // Approach Logic (Z-axis)
        if (this.pos.z < targetZ - 100) {
            this.pos.z += 4; // Move closer (towards positive)
        } else if (this.pos.z > targetZ + 100) {
            this.pos.z -= 10; // Catch up fast (towards negative)
        } else {
            this.pos.z = lerp(this.pos.z, targetZ, 0.05);
        }

        // Smoothly track X
        this.pos.x = lerp(this.pos.x, targetX, 0.05);

        // Lock Y-axis
        this.pos.y = 0;
        // ------------------------------------

        // Wing Animation
        this.wingAngle += 0.1;

        // Attack Logic
        this.fireTimer++;
        let threshold = max(50, 80 - (this.phase * 5));

        if (this.fireTimer > threshold) {
            let r = random();

            if (this.phase > 1) {
                if (r < 0.2) this.fireRadialAttack();
                else if (r < 0.6) this.fireAimedSpread();
                else this.fireFlankAttack();
            } else {
                if (r < 0.4) this.fireRadialAttack();
                else if (r < 0.8) this.fireAimedSpread();
                else this.fireFlankAttack();
            }

            if (typeof enemyFireSound === 'function') enemyFireSound();
            this.fireTimer = 0;
        }
    }

    fireRadialAttack() {
        let count = 16 + (this.phase - 1) * 8;
        for (let i = 0; i < count; i++) {
            let theta = (TWO_PI / count) * i + this.wingAngle * 0.5;
            let v = createVector(sin(theta) * 15, cos(theta) * 15, 20);
            v.setMag(25);
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 300, v, 'ENEMY'));
            }
        }
    }

    fireAimedSpread() {
        let target = createVector(0, 0, 500);
        if (typeof leader !== 'undefined' && leader) target = leader.pos.copy();

        let dir = p5.Vector.sub(target, this.pos);
        let baseAngle = atan2(dir.x, dir.z);

        let bulletCount = 5 + (this.phase - 1) * 2;
        let startIdx = -floor(bulletCount / 2);
        let endIdx = floor(bulletCount / 2);

        for (let i = startIdx; i <= endIdx; i++) {
            let theta = baseAngle + i * 0.15;
            let v = createVector(sin(theta), 0, cos(theta));
            v.setMag(30);

            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 200, v, 'ENEMY'));
            }
        }
    }

    fireFlankAttack() {
        let v = createVector(0, 0, 40);
        let offsets = [-400, 400, -200, 200];

        for (let ox of offsets) {
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x + ox, this.pos.y, this.pos.z + 100, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
        if (d < 500) {
            this.coreHp -= damage;
            this.shakeTimer = 10;

            if (this.coreHp <= 0) {
                this.active = false;
                return 'DESTROYED';
            }
            if (typeof hitSound === 'function') hitSound();
            return 'CORE';
        }
        return 'MISS';
    }

    display() {
        push();
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-25, 25); shakeY = random(-25, 25); shakeZ = random(-25, 25);
            this.shakeTimer--;
            stroke(255, 50, 50);
            strokeWeight(4);
        } else {
            if (this.phase > 1) stroke(100, 0, 200);
            else stroke(150, 0, 50);
            strokeWeight(3);
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);
        noFill();

        push();
        scale(3);
        box(120, 80, 150);
        push(); translate(0, -40, 120); box(80, 60, 60);
        push(); translate(-50, 10, 40); rotateY(-0.3); box(30, 20, 60); pop();
        push(); translate(50, 10, 40); rotateY(0.3); box(30, 20, 60); pop();
        if (this.phase > 1) {
            push(); translate(0, -40, 40); rotateX(-0.5); box(20, 20, 100); pop();
        }
        pop();

        push(); translate(0, 20, -150); rotateX(-0.1); box(100, 80, 180); pop();

        let flap = sin(this.wingAngle) * 0.3;
        fill(this.phase > 1 ? color(50, 0, 100, 80) : color(150, 0, 50, 50));
        push(); translate(-70, -50, 20); rotateZ(-flap + 0.2); box(250, 10, 400); pop();
        push(); translate(70, -50, 20); rotateZ(flap - 0.2); box(250, 10, 400); pop();
        pop();

        push(); translate(0, -500, 0); rotateY(PI);
        noStroke(); fill(50); rect(-200, -20, 400, 40);
        fill(255, 50, 50);
        let hpW = map(this.coreHp, 0, this.maxCoreHp, 0, 400);
        hpW = max(0, hpW);
        rect(-200, -20, hpW, 40);
        stroke(255); noFill(); rect(-200, -20, 400, 40);
        pop();
        pop();
    }
}
