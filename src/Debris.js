class Debris {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        // WIDER SPREAD: Much higher velocity magnitude
        this.vel = p5.Vector.random3D().mult(random(30, 100));
        this.angVel = p5.Vector.random3D().mult(random(0.1, 0.4));
        this.size = random(5, 25);
        this.life = 255;
        // RED ONLY: Varying shades of intense red
        this.col = color(255, random(0, 50), random(0, 50));
    }

    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.95); // Slightly less drag to let them fly further
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
