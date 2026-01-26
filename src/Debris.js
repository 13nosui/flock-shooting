class Debris {
    constructor(x, y, z, col) {
        this.pos = createVector(x, y, z);
        // Explosive spread
        this.vel = p5.Vector.random3D().mult(random(5, 20));
        this.angVel = createVector(random(-0.1, 0.1), random(-0.1, 0.1), random(-0.1, 0.1));
        this.size = random(8, 18);
        this.life = 255; // Use alpha value directly
        this.col = col;
    }

    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.95); // Air drag
        this.life -= 5; // Fade out speed
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
        strokeWeight(1);
        box(this.size);
        pop();
    }
}
