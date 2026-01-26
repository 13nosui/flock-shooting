class VoxelObstacle {
    constructor() {
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        this.size = random(180, 350);
        this.speed = 22;
        this.active = true;
        this.isHit = false;
        this.maxHp = 5;
        this.hp = this.maxHp;
        this.shakeTimer = 0;
    }
    update() {
        this.pos.z += this.speed;
        if (this.pos.z > 1000) this.active = false;
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
            stroke(isInverted ? 0 : 255, 120);
            strokeWeight(1);
        }

        noFill();
        box(this.size);
        pop();
    }
}
