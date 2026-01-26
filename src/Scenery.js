class Scenery {
    constructor() {
        // Spawn far away to the left or right (leaving center clear)
        let side = random() > 0.5 ? 1 : -1;
        this.pos = createVector(
            side * random(1500, 4000), // Far sides
            random(-1000, 1000),       // Vertical variance
            -5000                      // Start far ahead
        );
        this.w = random(200, 800);
        this.h = random(1000, 5000); // Very tall
        this.d = random(200, 800);
        this.active = true;
    }

    update(speed) {
        // Move slightly faster than the base speed to enhance "speed" sensation
        this.pos.z += speed * 1.2;
        if (this.pos.z > 2000) this.active = false; // Despawn behind camera
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        strokeWeight(1);
        // Subtle grey color
        stroke(isInverted ? 50 : 200, 40);
        noFill();
        box(this.w, this.h, this.d);
        pop();
    }
}
