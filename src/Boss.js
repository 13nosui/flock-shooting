class Boss {
    constructor() {
        this.pos = createVector(0, 0, -4000);
        this.targetZ = -1500;
        this.coreSize = 600;

        // --- BALANCE: Reduced HP for better pacing ---
        this.coreHp = 100;
        this.maxCoreHp = 100;
        // ---------------------------------------------

        this.active = true;
        this.fireTimer = 0;
        this.angle = 0;

        // --- NEW: Shake Timer ---
        this.shakeTimer = 0;

        // 4 Rotating Shields
        this.shields = [];
        for (let i = 0; i < 4; i++) {
            this.shields.push({
                active: true,
                hp: 30, // Reduced from 80
                offsetAngle: (TWO_PI / 4) * i,
                size: 250,
                dist: 700
            });
        }
    }

    update() {
        if (this.pos.z < this.targetZ) {
            this.pos.z += 5;
        }

        // Ensure Y is locked
        this.pos.y = 0;

        this.angle += 0.02;

        this.fireTimer++;
        if (this.fireTimer > 100) {
            this.fireRadialAttack();
            if (typeof enemyFireSound === 'function') enemyFireSound();
            this.fireTimer = 0;
        }
    }

    fireRadialAttack() {
        let count = 12;
        for (let i = 0; i < count; i++) {
            let theta = (TWO_PI / count) * i + this.angle;
            let v = createVector(sin(theta) * 10, cos(theta) * 10, 20);
            if (typeof enemyBullets !== 'undefined') {
                // FIX: Spawn bullets further ahead to prevent clipping (z + 600)
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 600, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        // 1. Check Shields
        for (let s of this.shields) {
            if (!s.active) continue;
            let sx = this.pos.x + cos(this.angle + s.offsetAngle) * s.dist;
            let sy = this.pos.y + sin(this.angle + s.offsetAngle) * s.dist;
            let sz = this.pos.z;

            let d = dist(impactPos.x, impactPos.y, impactPos.z, sx, sy, sz);
            if (d < s.size / 2 + 50) {
                s.hp -= damage;

                // --- TRIGGER SHAKE ---
                this.shakeTimer = 10;
                // ---------------------

                if (s.hp <= 0) {
                    s.active = false;
                    if (typeof spawnExplosion === 'function') spawnExplosion(sx, sy, sz);
                    if (typeof destroySound === 'function') destroySound();
                } else {
                    if (typeof hitSound === 'function') hitSound();
                }
                return 'SHIELD';
            }
        }

        // 2. Check Core
        let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
        if (d < this.coreSize / 2 + 50) {
            this.coreHp -= damage;

            // --- TRIGGER SHAKE ---
            this.shakeTimer = 10;
            // ---------------------

            if (this.coreHp <= 0) {
                this.active = false;
                return 'DESTROYED';
            }
            return 'CORE';
        }

        return 'MISS';
    }

    display() {
        push();

        // --- APPLY SHAKE ---
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            let mag = 20; // Shake magnitude
            shakeX = random(-mag, mag);
            shakeY = random(-mag, mag);
            shakeZ = random(-mag, mag);
            this.shakeTimer--;
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);
        // -------------------

        // Draw Core
        noFill();
        strokeWeight(4);
        // Flash color on hit
        if (this.shakeTimer > 0) stroke(255, 255, 0); // Yellow flash
        else stroke(255, 0, 0);

        push();
        rotateY(this.angle * 0.5);
        box(this.coreSize);
        pop();

        // Inner Core (Glowing)
        if (this.shakeTimer > 0) fill(255, 200, 0, 200);
        else fill(255, 0, 0, 100);

        box(this.coreSize * 0.3 + sin(frameCount * 0.1) * 50);

        // Draw Shields
        for (let s of this.shields) {
            if (!s.active) continue;
            push();
            rotateZ(this.angle + s.offsetAngle);
            translate(s.dist, 0, 0);
            rotateX(this.angle * 2);
            rotateY(this.angle);

            stroke(0, 255, 255);
            strokeWeight(3);

            // Flash shield on hit
            if (this.shakeTimer > 0) fill(200, 255, 255, 100);
            else fill(0, 50, 200, 30);

            box(s.size);
            pop();
        }
        pop();
    }
}
