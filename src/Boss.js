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
                hp: 50, // Increased to 50
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
            v.setMag(24.5); // Force speed to user spec
            if (typeof enemyBullets !== 'undefined') {
                // FIX: Spawn bullets further ahead to prevent clipping (z + 600)
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 600, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        // 1. Check Shields
        let anyShieldActive = false;
        for (let s of this.shields) {
            if (!s.active) continue;
            anyShieldActive = true;

            let sx = this.pos.x + cos(this.angle + s.offsetAngle) * s.dist;
            let sy = this.pos.y + sin(this.angle + s.offsetAngle) * s.dist;
            let sz = this.pos.z;

            let d = dist(impactPos.x, impactPos.y, impactPos.z, sx, sy, sz);
            if (d < s.size / 2 + 50) {
                s.hp -= damage;
                this.shakeTimer = 10;

                if (s.hp <= 0) {
                    s.active = false;
                    if (typeof spawnExplosion === 'function') {
                        for (let k = 0; k < 5; k++) {
                            spawnExplosion(
                                sx + random(-50, 50),
                                sy + random(-50, 50),
                                sz + random(-50, 50)
                            );
                        }
                    }
                    if (typeof destroySound === 'function') destroySound();
                } else {
                    if (typeof hitSound === 'function') hitSound();
                }
                return 'SHIELD';
            }
        }

        // 2. Check Core
        // ONLY Vulnerable if all shields are destroyed
        if (!anyShieldActive) {
            let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
            if (d < this.coreSize / 2 + 50) {
                this.coreHp -= damage;
                this.shakeTimer = 10;

                if (this.coreHp <= 0) {
                    this.active = false;
                    return 'DESTROYED';
                }
                if (typeof hitSound === 'function') hitSound();
                return 'CORE';
            }
        } else {
            // Check if bullet "hits" core area but is blocked by invulnerability
            let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
            if (d < this.coreSize / 2 + 50) {
                // Add a visual or sound cue for blocked damage?
                if (typeof hitSound === 'function') hitSound(); // Still play hit sound to show contact
                return 'CORE_INVULNERABLE';
            }
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

        // --- NEW: HP BAR ---
        push();
        translate(0, -this.coreSize / 2 - 120, 0); // Position above core
        rotateY(-this.angle * 0.5); // Counter-rotate to face camera roughly

        noStroke();
        fill(50);
        rect(-150, -15, 300, 30); // Background

        fill(255, 50, 50);
        let hpW = map(this.coreHp, 0, this.maxCoreHp, 0, 300);
        rect(-150, -15, hpW, 30); // HP Bar

        stroke(255);
        strokeWeight(2);
        noFill();
        rect(-150, -15, 300, 30); // Frame
        pop();
        // -------------------

        pop();
    }
}
