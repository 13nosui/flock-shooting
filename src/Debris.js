class Debris {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        // Explosive speed!
        this.vel = p5.Vector.random3D().mult(random(15, 45));
        this.angVel = p5.Vector.random3D().mult(random(0.1, 0.3));
        this.size = random(5, 25);
        this.life = 255;
        // Random neon colors
        let colors = [color(255, 50, 50), color(0, 255, 255), color(255, 255, 0), color(255)];
        this.col = random(colors);
    }

    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.92); // Drag to slow them down gracefully
        this.life -= 4; // Fade out
    }

    display() {
        if (this.life <= 0) return;
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        rotateX(frameCount * this.angVel.x);
        rotateY(frameCount * this.angVel.y);
        rotateZ(frameCount * this.angVel.z);

        noFill();
        stroke(red(this.col), green(this.col), blue(this.col), this.life);
        strokeWeight(2); // Thicker lines for visibility
        box(this.size);
        pop();
    }
}
