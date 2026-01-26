class Scenery {
    constructor() {
        // Spawn closer to center (800-2500 range) to ensure they are in camera view
        let side = random() > 0.5 ? 1 : -1;
        this.pos = createVector(
            side * random(800, 2500),  // Moved closer (was 1500-4000)
            random(-1000, 1000),       // Vertical variance
            -5000                      // Start far ahead
        );
        this.w = random(200, 800);
        this.h = random(1000, 5000);
        this.d = random(200, 800);
        this.active = true;
    }

    update(speed) {
        this.pos.z += speed * 1.5; // Move slightly faster for parallax
        if (this.pos.z > 2000) this.active = false;
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        strokeWeight(2); // Thicker lines
        // Higher opacity (100) and brighter color for visibility check
        stroke(isInverted ? 50 : 200, 100);

        noFill();
        box(this.w, this.h, this.d);
        pop();
    }
}
