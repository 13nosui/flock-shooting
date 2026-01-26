class Scenery {
    constructor() {
        // Spawn far away and to the sides
        let side = random() > 0.5 ? 1 : -1;
        this.pos = createVector(
            side * random(1500, 3000), // Far left or right
            random(-500, 500),         // Moderate height dispersion
            -5000                      // Start far ahead
        );
        this.w = random(200, 600);
        this.h = random(1000, 4000);
        this.d = random(200, 600);
        this.active = true;
    }

    update(speed) {
        this.pos.z += speed;
        if (this.pos.z > 2000) this.active = false; // Despawn behind camera
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        strokeWeight(0.5); // Thin lines for background
        stroke(isInverted ? 50 : 200, 50); // Faint color
        noFill();
        box(this.w, this.h, this.d);
        pop();
    }
}
