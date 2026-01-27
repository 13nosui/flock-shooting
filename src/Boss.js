class Boss {
    constructor() {
        this.pos = createVector(0, 0, -5000); // Start further back
        this.targetZ = -2000; // Stay somewhat distant

        // Combined HP (was 100 + 4*50 = 300)
        this.coreHp = 300;
        this.maxCoreHp = 300;

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
        if (this.fireTimer > 80) {
            this.fireRadialAttack();
            if (typeof enemyFireSound === 'function') enemyFireSound();
            this.fireTimer = 0;
        }
    }

    fireRadialAttack() {
        let count = 16; // More bullets
        for (let i = 0; i < count; i++) {
            let theta = (TWO_PI / count) * i + this.wingAngle * 0.5;
            let v = createVector(sin(theta) * 15, cos(theta) * 15, 20); // Wider spread
            v.setMag(25);
            if (typeof enemyBullets !== 'undefined') {
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 300, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        // Simplified Collision: Single Large Sphere
        // Overall size is roughly 1000x400x800
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
            stroke(150, 0, 50); // Dark chitin color
            strokeWeight(3);
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);
        noFill();

        // --- GIANT INSECT MODEL ---

        // Main Body (Thorax & Abdomen)
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
        pop();

        // Abdomen (Tail)
        push();
        translate(0, 20, -150);
        rotateX(-0.1);
        box(100, 80, 180);
        pop();

        // Giant Wings
        let flap = sin(this.wingAngle) * 0.3;
        fill(150, 0, 50, 50); // Semi-transparent dark wings

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
