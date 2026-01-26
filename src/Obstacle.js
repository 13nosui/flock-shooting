class VoxelObstacle {
    constructor(difficulty = 1.0) {
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        this.active = true;
        this.isHit = false;
        this.shakeTimer = 0;
        this.difficulty = difficulty;

        // Determine Type
        let r = random();
        if (r < 0.1) {
            this.type = 'TANK';
            this.size = random(400, 600);
            this.speed = 11 * difficulty; // Slow
            this.maxHp = floor(15 + (difficulty - 1) * 15);
            this.color = color(100, 50, 150); // Dark Purple
        } else if (r < 0.3) {
            this.type = 'INTERCEPTOR';
            this.size = random(80, 120);
            this.speed = 40 * difficulty; // Fast
            this.maxHp = 1; // Always one shot
            this.color = color(255, 255, 100); // Yellow
        } else {
            this.type = 'NORMAL';
            this.size = random(180, 350);
            this.speed = 22 * difficulty;
            this.maxHp = floor(3 + (difficulty - 1) * 5);
            this.color = null; // Default red shades for hits
        }

        this.hp = this.maxHp;
        this.fireTimer = random(120, 240) / difficulty;
    }

    getDropItemType() {
        if (this.type === 'TANK') {
            let r = random();
            if (r < 0.4) return 'LASER';
            if (r < 0.8) return 'HOMING';
            return 'GROWTH';
        }
        // Small chance for weapon items from normal/interceptors
        if (random() < 0.05) {
            return random(['LASER', 'HOMING']);
        }
        return 'GROWTH';
    }
    update() {
        this.pos.z += this.speed;
        if (this.pos.z > 1000) this.active = false;

        // Shooting Logic
        this.fireTimer--;
        if (this.fireTimer <= 0 && this.active) {
            // Fire only if enemy is well ahead of player
            if (leader && this.pos.z < leader.pos.z - 200) {

                let dir = p5.Vector.sub(leader.pos, this.pos);

                // Determine Bullet Speed based on Enemy Type
                // MUST be faster than the enemy's own speed (Tank: ~11, Normal: ~22, Interceptor: ~40)
                let bulletSpeed = 15; // Default (Tank)
                if (this.type === 'NORMAL') bulletSpeed = 45;
                if (this.type === 'INTERCEPTOR') bulletSpeed = 70;

                // Spawn position: Start slightly in front of the enemy to avoid clipping
                let spawnZ = this.pos.z + (this.size / 2) + 10;

                if (this.type === 'TANK') {
                    // --- TANK: 3-Way Radial Shot ---
                    let angles = [-0.3, 0, 0.3];
                    for (let angle of angles) {
                        let spreadDir = dir.copy();
                        let angleY = atan2(spreadDir.x, spreadDir.z) + angle;
                        let mag = spreadDir.mag();
                        let finalDir = createVector(sin(angleY) * mag, spreadDir.y, cos(angleY) * mag);

                        finalDir.setMag(20); // Tank bullets can be a bit slower but visible
                        if (typeof enemyBullets !== 'undefined') {
                            enemyBullets.push(new Bullet(this.pos.x, this.pos.y, spawnZ, finalDir, 'ENEMY'));
                        }
                    }
                } else {
                    // --- NORMAL / INTERCEPTOR: Single Shot ---
                    dir.setMag(bulletSpeed);
                    if (typeof enemyBullets !== 'undefined') {
                        enemyBullets.push(new Bullet(this.pos.x, this.pos.y, spawnZ, dir, 'ENEMY'));
                    }
                }

                // Reset Timer
                let rate = (this.difficulty || 1);
                if (this.type === 'TANK') {
                    this.fireTimer = 180 / rate;
                } else {
                    // Shoot more often for fast enemies
                    this.fireTimer = random(45, 90) / rate;
                }
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 20; // Longer shake
        if (this.hp <= 0) {
            this.active = false;
            return true; // Destroyed
        }
        return false;
    }

    display() {
        push();

        // Intense Shake Calculation
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-15, 15); // Stronger shake
            shakeY = random(-15, 15);
            shakeZ = random(-15, 15);
            this.shakeTimer--;
        }

        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);

        // Rotational Jitter
        if (this.shakeTimer > 0) {
            rotateX(random(-0.2, 0.2));
            rotateY(random(-0.2, 0.2));
            rotateZ(random(-0.2, 0.2));

            // Flash Color
            stroke(255, 50, 50); // Bright Red
            strokeWeight(3);
        } else {
            stroke(this.color || (isInverted ? 0 : 255), this.type === 'TANK' ? 200 : 120);
            strokeWeight(this.type === 'TANK' ? 2.5 : 1);
        }

        noFill();
        box(this.size);
        pop();
    }
}
