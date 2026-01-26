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

        // 1. Face the Camera (Align with high-angle view)
        rotateX(-PI / 4); // Approx 45 degrees up

        // 2. High Contrast Style (White Text, Black Stroke)
        stroke(0);
        strokeWeight(4);
        fill(255, map(this.life, 0, this.maxLife, 0, 255));

        // 3. Force System Font (Safety)
        textFont('sans-serif');
        textStyle(BOLD);

        textAlign(CENTER, CENTER);
        textSize(this.size);

        // 4. Force On Top (Disable Depth Test)
        drawingContext.disable(drawingContext.DEPTH_TEST);
        text(this.txt, 0, 0);
        drawingContext.enable(drawingContext.DEPTH_TEST);

        pop();
    }
}
