class VoxelObstacle {
    constructor(difficulty = 1.0) {
        // --- UPDATED: Spawn relative to player ---
        let baseX = 0;
        let baseZ = -3000;

        if (typeof leader !== 'undefined' && leader) {
            baseX = leader.pos.x;
            baseZ = leader.pos.z;
        }

        // Spawn in a wide area ahead of the player
        this.pos = createVector(
            baseX + random(-1500, 1500),
            random(-boundsY, boundsY),
            baseZ - random(1500, 3500) // Spawn ahead (Z is usually negative forward)
        );
        // -----------------------------------------

        this.active = true;
        this.isHit = false;
        this.shakeTimer = 0;
        this.difficulty = difficulty;

        // Determine Type
        let r = random();
        if (r < 0.1) {
            this.type = 'TANK';
            this.size = random(400, 600);
            this.speed = 0; // Stationary
            this.maxHp = floor(15 + (difficulty - 1) * 15);
            this.color = color(100, 50, 150);
            this.fireTimer = random(100, 150) / difficulty;
        } else if (r < 0.3) {
            this.type = 'INTERCEPTOR';
            this.size = random(80, 120);
            this.speed = 0; // Stationary
            this.maxHp = 1;
            this.color = color(255, 255, 100);
            this.fireTimer = random(20, 50) / difficulty;
        } else {
            this.type = 'NORMAL';
            this.size = random(180, 350);
            this.speed = 0; // Stationary
            this.maxHp = floor(3 + (difficulty - 1) * 5);
            this.color = null;
            this.fireTimer = random(50, 90) / difficulty;
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
        if (random() < 0.05) return random(['LASER', 'HOMING']);
        return 'GROWTH';
    }

    update() {
        // --- MOVEMENT REMOVED: Object is stationary ---

        // Cleanup if too far (culling)
        if (leader && p5.Vector.dist(this.pos, leader.pos) > 6000) {
            this.active = false;
        }

        // Shooting Logic (Aims at player)
        this.fireTimer--;
        if (this.fireTimer <= 0 && this.active) {
            if (leader) {
                let distToPlayer = dist(this.pos.x, this.pos.y, this.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);

                // Fire if within range
                if (distToPlayer < 3000) {
                    let dir = p5.Vector.sub(leader.pos, this.pos);

                    // Determine Bullet Speed
                    let bulletSpeed = 10;
                    if (this.type === 'NORMAL') bulletSpeed = 20;
                    if (this.type === 'INTERCEPTOR') bulletSpeed = 30;

                    let spawnZ = this.pos.z + (this.size / 2) + 20;

                    if (this.type === 'TANK') {
                        // 3-Way Radial Shot
                        let angles = [-0.3, 0, 0.3];
                        for (let angle of angles) {
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
                        // Single Shot
                        dir.setMag(bulletSpeed);
                        if (typeof enemyBullets !== 'undefined') {
                            enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z, dir, 'ENEMY'));
                            if (typeof enemyFireSound === 'function') enemyFireSound();
                        }
                    }

                    // Reset Timer
                    let rate = (this.difficulty || 1);
                    if (this.type === 'TANK') this.fireTimer = 180 / rate;
                    else this.fireTimer = random(40, 80) / rate;
                }
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 20;
        if (this.hp <= 0) {
            this.active = false;
            if (typeof destroySound === 'function') destroySound();
            return true;
        }
        if (typeof hitSound === 'function') hitSound();
        return false;
    }

    display() {
        push();
        let shakeX = 0, shakeY = 0, shakeZ = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-15, 15); shakeY = random(-15, 15); shakeZ = random(-15, 15);
            this.shakeTimer--;
        }
        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z + shakeZ);

        if (this.shakeTimer > 0) {
            rotateX(random(-0.2, 0.2)); rotateY(random(-0.2, 0.2)); rotateZ(random(-0.2, 0.2));
            stroke(255, 50, 50); strokeWeight(3);
        } else {
            stroke(this.color || (isInverted ? 0 : 255), this.type === 'TANK' ? 200 : 120);
            strokeWeight(this.type === 'TANK' ? 2.5 : 1);
        }
        noFill();
        box(this.size);
        pop();
    }
}
