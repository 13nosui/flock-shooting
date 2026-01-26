class Bullet {
    constructor(x, y, z, vel, isLaser = false) {
        this.pos = createVector(x, y, z);
        this.vel = vel;
        this.isLaser = isLaser;
        this.active = true;
        this.size = isLaser ? 400 : 80;
    }

    update() {
        this.pos.add(this.vel);
        // Remove if out of bounds
        if (this.pos.z < -4000) {
            this.active = false;
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        stroke(isInverted ? 0 : 255);
        if (this.isLaser) {
            strokeWeight(4);
            line(0, 0, 0, 0, 0, this.size);
        } else {
            strokeWeight(1.5);
            line(0, 0, 0, 0, 0, this.size);
        }
        pop();
    }
}
