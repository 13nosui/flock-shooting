class Boss {
    constructor() {
        this.pos = createVector(0, 0, -4000);
        this.targetZ = -1500;
        this.coreSize = 600;
        this.coreHp = 100; // Reduced from 300
        this.maxCoreHp = 100;
        this.active = true;
        this.fireTimer = 0;
        this.angle = 0;

        // 4 Rotating Shields
        this.shields = [];
        for (let i = 0; i < 4; i++) {
            this.shields.push({
                active: true,
                hp: 30, // Reduced from 80
                offsetAngle: (TWO_PI / 4) * i,
                size: 250,
                dist: 700 // Distance from core
            });
        }
    }

    update() {
        // Approach
        if (this.pos.z < this.targetZ) {
            this.pos.z += 5;
        }

        // Rotation
        this.angle += 0.02;

        // Attack Logic
        this.fireTimer++;
        if (this.fireTimer > 100) {
            this.fireRadialAttack();
            this.fireTimer = 0;
        }
    }

    fireRadialAttack() {
        // Fire 12 bullets in a circle
        let count = 12;
        for (let i = 0; i < count; i++) {
            let theta = (TWO_PI / count) * i + this.angle;
            // Spread in X-Y plane, moving towards player in Z
            let v = createVector(sin(theta) * 10, cos(theta) * 10, 20); // Towards camera
            if (typeof enemyBullets !== 'undefined') {
                // SPAWN FURTHER FRONT (z + 600) to clear boss mesh
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 600, v, 'ENEMY'));
            }
        }
    }

    takeDamage(damage, impactPos) {
        // 1. Check Shields
        for (let s of this.shields) {
            if (!s.active) continue;
            // Calculate shield world position
            let sx = this.pos.x + cos(this.angle + s.offsetAngle) * s.dist;
            let sy = this.pos.y + sin(this.angle + s.offsetAngle) * s.dist;
            let sz = this.pos.z; // Shields are roughly on same Z plane as center for simplicity

            let d = dist(impactPos.x, impactPos.y, impactPos.z, sx, sy, sz);
            if (d < s.size / 2 + 50) { // Hit Shield
                s.hp -= damage;
                if (s.hp <= 0) {
                    s.active = false;
                    if (typeof spawnExplosion === 'function') spawnExplosion(sx, sy, sz);
                }
                return 'SHIELD';
            }
        }

        // 2. Check Core
        let d = dist(impactPos.x, impactPos.y, impactPos.z, this.pos.x, this.pos.y, this.pos.z);
        if (d < this.coreSize / 2 + 50) {
            this.coreHp -= damage;
            if (this.coreHp <= 0) {
                this.active = false; // Boss Defeated
                return 'DESTROYED';
            }
            return 'CORE';
        }

        return 'MISS';
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        // Draw Core
        noFill();
        strokeWeight(4);
        stroke(255, 0, 0);

        push();
        rotateY(this.angle * 0.5);
        box(this.coreSize);
        pop();

        // Inner Core (Glowing)
        fill(255, 0, 0, 100);
        box(this.coreSize * 0.3 + sin(frameCount * 0.1) * 50);

        // Draw Shields
        for (let s of this.shields) {
            if (!s.active) continue;
            push();
            // Orbit rotation logic
            // We use Z-rotation for orbital position in X-Y plane
            rotateZ(this.angle + s.offsetAngle);
            translate(s.dist, 0, 0);

            // Local rotation of the shield block
            rotateX(this.angle * 2);
            rotateY(this.angle);

            stroke(0, 255, 255);
            strokeWeight(3);
            fill(0, 50, 200, 30);
            box(s.size);
            pop();
        }
        pop();
    }
}
