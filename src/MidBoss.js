class MidBoss {
    constructor(phase = 1) {
        this.phase = phase;
        this.pos = createVector(0, 0, -4000);
        this.targetZ = -1200;

        // Scale HP
        this.hp = 70 + (this.phase - 1) * 50;
        this.maxHp = this.hp;

        this.active = true;
        this.fireTimer = 0;
        this.shakeTimer = 0;
    }

    update() {
        // Approach
        if (this.pos.z < this.targetZ) this.pos.z += 8;

        // Hover Motion (X-axis only)
        this.pos.x = sin(frameCount * 0.02) * 300;

        // FIX: Lock Y-axis to 0
        this.pos.y = 0;

        // Attack Frequency increases with phase
        this.fireTimer++;
        let threshold = max(40, 80 - (this.phase * 5)); // Faster fire rate
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

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 20;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    display() {
        push();

        // Shake logic
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-15, 15);
            shakeY = random(-15, 15);
            shakeZ = random(-15, 15);
            this.shakeTimer--;
        }

        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);

        // --- EVOLVED APPEARANCE ---
        if (this.shakeTimer > 0) {
            stroke(255, 50, 50);
            strokeWeight(3);
            rotateX(random(-0.1, 0.1));
            rotateY(random(-0.1, 0.1));
            rotateZ(random(-0.1, 0.1));
        } else if (this.phase > 1) {
            stroke(255, 150, 0); // Orange/Red for evolved
            strokeWeight(3);
        } else {
            stroke(100, 255, 100); // Original Green
            strokeWeight(2);
        }

        noFill();

        // Head
        push();
        translate(0, -30, 80);
        box(50, 40, 50);
        pop();

        // Thorax (Body)
        box(80, 60, 100);

        // Abdomen (Tail)
        push();
        translate(0, 10, -100);
        rotateX(-0.2);
        box(70, 50, 120);
        pop();

        // Wings
        let flap = sin(frameCount * 0.8) * 0.5;

        // Left Wing
        push();
        translate(-40, -30, 20);
        rotateZ(-flap + 0.5);
        fill(this.phase > 1 ? color(255, 100, 0, 50) : color(100, 255, 100, 30));
        box(180, 10, 80);
        pop();

        // Right Wing
        push();
        translate(40, -30, 20);
        rotateZ(flap - 0.5);
        fill(this.phase > 1 ? color(255, 100, 0, 50) : color(100, 255, 100, 30));
        box(180, 10, 80);
        pop();

        // --- NEW: Phase 2+ Spikes ---
        if (this.phase > 1) {
            push();
            translate(0, -50, 0);
            rotateX(PI / 4);
            box(20, 80, 20); // Spike on back
            pop();
        }

        // --- HP BAR ---
        push();
        translate(0, -150, 0);
        noStroke();
        fill(50);
        rect(-60, -5, 120, 10); // BG
        fill(255, 50, 50);
        let hpW = map(this.hp, 0, this.maxHp, 0, 120);
        rect(-60, -5, hpW, 10); // HP
        stroke(255);
        noFill();
        rect(-60, -5, 120, 10); // Frame
        pop();

        pop();
    }
}
