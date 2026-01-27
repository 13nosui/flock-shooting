class Boss {
    constructor(phase = 1) {
        this.phase = phase;
        this.pos = createVector(0, 0, -5000); // Start further back
        this.targetZ = -2000; // Stay somewhat distant

        // Massive HP Scaling
        this.coreHp = 300 + (this.phase - 1) * 200;
        this.maxCoreHp = this.coreHp;

        this.active = true;
        this.fireTimer = 0;
        this.wingAngle = 0;
        this.shakeTimer = 0;
    }

    update() {
        // Approach
        if (this.pos.z < this.targetZ) this.pos.z += 4;

        // Lock Y-axis
        this.pos.y = 0;

        // Wing Animation
        this.wingAngle += 0.1;

        // Attack Logic
        this.fireTimer++;
        // Fire faster in later phases
        let threshold = max(50, 80 - (this.phase * 5));

        if (this.fireTimer > threshold) {
            let r = random();

            // Phase 2+ is much more aggressive with aimed/flank shots
            if (this.phase > 1) {
                if (r < 0.2) this.fireRadialAttack();
                else if (r < 0.6) this.fireAimedSpread(); // High chance to aim
                else this.fireFlankAttack();
            } else {
                // Phase 1 (Standard)
                if (r < 0.4) this.fireRadialAttack();
                else if (r < 0.8) this.fireAimedSpread();
                else this.fireFlankAttack();
            }

            if (typeof enemyFireSound === 'function') enemyFireSound();
            this.fireTimer = 0;
        }
    }

    fireRadialAttack() {
        let count = 16 + (this.phase - 1) * 8; // More bullets each phase
        for (let i = 0; i < count; i++) {
            let theta = (TWO_PI / count) * i + this.wingAngle * 0.5;
            let v = createVector(sin(theta) * 15, cos(theta) * 15, 20); // Wider spread
            v.setMag(25);
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 300, v, 'ENEMY'));
            }
        }
    }

    // --- NEW ATTACK: Aimed Spread (Shotgun) ---
    fireAimedSpread() {
        let target = createVector(0, 0, 500);
        if (typeof leader !== 'undefined' && leader) target = leader.pos.copy();

        let dir = p5.Vector.sub(target, this.pos);
        let baseAngle = atan2(dir.x, dir.z);

        // Fire more bullets in a fan each phase
        let bulletCount = 5 + (this.phase - 1) * 2;
        let startIdx = -floor(bulletCount / 2);
        let endIdx = floor(bulletCount / 2);

        for (let i = startIdx; i <= endIdx; i++) {
            let theta = baseAngle + i * 0.15; // 0.15 radian spread
            let v = createVector(sin(theta), 0, cos(theta));
            v.setMag(30); // Fast speed

            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 200, v, 'ENEMY'));
            }
        }
    }

    // --- NEW ATTACK: Flank Fire (Side Cannons) ---
    fireFlankAttack() {
        let v = createVector(0, 0, 40); // Very fast forward
        let offsets = [-400, 400, -200, 200]; // 4 shots from wide positions

        for (let ox of offsets) {
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x + ox, this.pos.y, this.pos.z + 100, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        // Simplified Collision: Single Large Sphere
        let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
        if (d < 500) { // Hit radius
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
        // --- APPLY SHAKE ---
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-25, 25); shakeY = random(-25, 25); shakeZ = random(-25, 25);
            this.shakeTimer--;
            stroke(255, 50, 50); // Red flash
            strokeWeight(4);
        } else {
            // Color Evolution
            if (this.phase > 1) stroke(100, 0, 200); // Evil Purple/Black
            else stroke(150, 0, 50); // Original Red
            strokeWeight(3);
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);
        noFill();

        // --- GIANT INSECT MODEL ---
        push();
        scale(3); // Scale up MidBoss-like structure

        // Thorax
        box(120, 80, 150);

        // Head (with mandibles)
        push();
        translate(0, -40, 120);
        box(80, 60, 60);
        // Mandibles
        push(); translate(-50, 10, 40); rotateY(-0.3); box(30, 20, 60); pop();
        push(); translate(50, 10, 40); rotateY(0.3); box(30, 20, 60); pop();

        // --- NEW: Giant Horn for Phase 2+ ---
        if (this.phase > 1) {
            push(); translate(0, -40, 40); rotateX(-0.5); box(20, 20, 100); pop();
        }
        pop(); // End Head

        // Abdomen (Tail)
        push();
        translate(0, 20, -150);
        rotateX(-0.1);
        box(100, 80, 180);
        pop();

        // Giant Wings
        let flap = sin(this.wingAngle) * 0.3;
        fill(this.phase > 1 ? color(50, 0, 100, 80) : color(150, 0, 50, 50));

        // Left Wing
        push();
        translate(-70, -50, 20); rotateZ(-flap + 0.2);
        box(250, 10, 400);
        pop();

        // Right Wing
        push();
        translate(70, -50, 20); rotateZ(flap - 0.2);
        box(250, 10, 400);
        pop();

        pop(); // End scale

        // --- HP BAR ---
        push();
        translate(0, -500, 0); // Position high above
        rotateY(PI); // Face camera (assuming camera is at Z > 0 looking at Z < 0)
        noStroke(); fill(50); rect(-200, -20, 400, 40); // BG
        fill(255, 50, 50);
        let hpW = map(this.coreHp, 0, this.maxCoreHp, 0, 400);
        hpW = max(0, hpW); // Constrain to 0 minimum
        rect(-200, -20, hpW, 40); // HP
        stroke(255); noFill(); rect(-200, -20, 400, 40); // Frame
        pop();

        pop();
    }
}
