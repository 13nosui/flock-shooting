class VoxelObstacle {
    constructor() {
        this.pos = createVector(random(-boundsX, boundsX), random(-boundsY, boundsY), -3000);
        this.size = random(180, 350);
        this.speed = 22;
        this.active = true;
        this.isHit = false;
    }
    update() {
        this.pos.z += this.speed;
        if (this.pos.z > 1000) this.active = false;
        let d = dist(this.pos.x, this.pos.y, this.pos.z, leader.pos.x, leader.pos.y, leader.pos.z);
        if (!this.isHit && d < this.size / 2 + 20) {
            this.isHit = true;
            triggerHitEffect();
        }
    }
    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        stroke(isInverted ? 0 : 255, 120);
        noFill();
        box(this.size);
        pop();
    }
}
