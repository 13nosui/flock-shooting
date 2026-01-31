class VoxelObstacle {
    constructor(difficulty = 1.0, basePos = null) {
        if (basePos) {
            // Spawn relative to player: random horizontal offset, fixed distance ahead in Z
            // Or fully random around player
            let angle = random(TWO_PI);
            let distToPlayer = random(3000, 5000);
            this.pos = createVector(
                basePos.x + cos(angle) * distToPlayer,
                random(-boundsY, boundsY),
                basePos.z + sin(angle) * distToPlayer
            );
        } else {
            this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        }
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
            this.fireTimer = random(100, 150) / difficulty; // Slow start for Tank
        } else if (r < 0.3) {
            this.type = 'INTERCEPTOR';
            this.size = random(80, 120);
            this.speed = 40 * difficulty; // Fast
            this.maxHp = 1; // Always one shot
            this.color = color(255, 255, 100); // Yellow
            this.fireTimer = random(20, 50) / difficulty; // FAST start!
        } else {
            this.type = 'NORMAL';
            this.size = random(180, 350);
            this.speed = 22 * difficulty;
            this.maxHp = floor(3 + (difficulty - 1) * 5);
            this.color = null; // Default red shades for hits
            this.fireTimer = random(50, 90) / difficulty; // Moderate start
        }

        this.hp = this.maxHp;
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
        // --- UPDATED: Tracking Movement ---
        if (typeof leader !== 'undefined' && leader) {
            let targetPos = leader.pos.copy();
            let dir = p5.Vector.sub(targetPos, this.pos);

            // Normalize and apply speed
            dir.normalize();
            dir.mult(this.speed);

            this.pos.add(dir);
        } else {
            // Fallback: Move forward if tracking fails
            this.pos.z += this.speed;
        }

        // Cleanup if way too far (prevent memory leaks)
        if (leader && p5.Vector.dist(this.pos, leader.pos) > 5000) {
            this.active = false;
        }

        // Shooting Logic
        this.fireTimer--;
        if (this.fireTimer <= 0 && this.active) {
            // Check if leader exists
            if (leader) {
                // Calculate distance
                let distToPlayer = dist(this.pos.x, this.pos.y, this.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);

                // Only fire if within range (e.g., 2000 units)
                if (distToPlayer < 2000) {
                    let dir = p5.Vector.sub(leader.pos, this.pos);

                    // Determine Bullet Speed
                    let bulletSpeed = 10; // TANK
                    if (this.type === 'NORMAL') bulletSpeed = 20;
                    if (this.type === 'INTERCEPTOR') bulletSpeed = 30;

                    if (this.type === 'TANK') {
                        // --- TANK: 3-Way Radial Shot ---
                        let angles = [-0.3, 0, 0.3];
                        for (let angle of angles) {
                            // Calculate spread relative to direction
                            let spreadDir = dir.copy();
                            let angleY = atan2(spreadDir.x, spreadDir.z) + angle;
                            let mag = spreadDir.mag();
                            let finalDir = createVector(sin(angleY) * mag, spreadDir.y, cos(angleY) * mag);

                            finalDir.setMag(bulletSpeed);
                            if (typeof enemyBullets !== 'undefined') {
                                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z, finalDir, 'ENEMY'));
                            }
                        }
                        if (typeof enemyFireSound === 'function') enemyFireSound();
                    } else {
                        // --- NORMAL / INTERCEPTOR: Single Shot ---
                        dir.setMag(bulletSpeed);
                        if (typeof enemyBullets !== 'undefined') {
                            enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z, dir, 'ENEMY'));
                            if (typeof enemyFireSound === 'function') enemyFireSound();
                        }
                    }

                    // Reset Timer
                    let rate = (this.difficulty || 1);
                    if (this.type === 'TANK') {
                        this.fireTimer = 180 / rate;
                    } else {
                        this.fireTimer = random(40, 80) / rate;
                    }
                }
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 20; // Longer shake
        if (this.hp <= 0) {
            this.active = false;
            if (typeof destroySound === 'function') destroySound();
            return true; // Destroyed
        }
        if (typeof hitSound === 'function') hitSound();
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
