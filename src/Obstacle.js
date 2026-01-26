class VoxelObstacle {
    constructor() {
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        this.size = random(180, 350);
        this.speed = 22;
        this.active = true;
        this.isHit = false;
        this.maxHp = floor(random(3, 6));
        this.hp = this.maxHp;
        this.shakeTimer = 0;
    }
    update() {
        this.pos.z += this.speed;
        if (this.pos.z > 1000) this.active = false;
        // Collision with leader handled in sketch.js, but keeping this for consistency
        let d = dist(this.pos.x, this.pos.y, this.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (!this.isHit && d < this.size / 2 + 20) {
            this.isHit = true;
            // Note: triggerHitEffect() is called here, but damage is handled in sketch.js
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.shakeTimer = 10; // Shake for 10 frames
        if (this.hp <= 0) {
            this.active = false;
            return true; // Destroyed
        }
        return false;
    }

    display() {
        push();

        // Calculate Shake
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeTimer > 0) {
            shakeX = random(-5, 5);
            shakeY = random(-5, 5);
            this.shakeTimer--;
        }

        translate(this.pos.x + shakeX, this.pos.y + shakeY, this.pos.z);

        // Visual feedback
        if (this.shakeTimer > 0) {
            stroke(255, 0, 0); // Flash red when hit
        } else {
            stroke(isInverted ? 0 : 255, 120);
        }

        strokeWeight(2);
        noFill();
        box(this.size);
        pop();
    }
}
