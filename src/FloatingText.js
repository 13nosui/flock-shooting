class FloatingText {
    constructor(x, y, z, txt, size, col) {
        this.pos = createVector(x, y, z);
        this.vel = p5.Vector.random3D().mult(2);
        this.vel.y -= 5; // Pop up
        this.txt = txt;
        this.life = 60;
        this.maxLife = 60;
        this.size = size;
        this.col = col || color(255);
    }

    update() {
        this.pos.add(this.vel);
        this.vel.mult(0.95); // Drag
        this.life -= 1;
    }

    display() {
        if (this.life <= 0) return;
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        // Face camera (rough billboarding)
        // Since we are in WEBGL mode and the camera is mostly fixed high/behind,
        // we can just reset rotation or leave it as text() defaults to facing screen.

        noStroke();
        fill(red(this.col), green(this.col), blue(this.col), map(this.life, 0, this.maxLife, 0, 255));

        // Font size and alignment
        textAlign(CENTER, CENTER);
        textSize(this.size * (this.life / this.maxLife)); // Shrink as it fades
        text(this.txt, 0, 0);
        pop();
    }
}
