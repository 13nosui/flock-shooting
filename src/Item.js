class Item {
    constructor(x, y, z) {
        this.pos = createVector(x, y, z);
        this.vel = createVector(0, 0, 15); // Move towards camera
        this.active = true;
        this.size = 20;
        this.angle = 0;
    }

    update(leaderPos) {
        this.pos.add(this.vel);

        // Magnetism
        let d = dist(this.pos.x, this.pos.y, this.pos.z, leaderPos.x, leaderPos.y, leaderPos.z);
        if (d < 400) {
            let magnetism = p5.Vector.sub(leaderPos, this.pos);
            magnetism.setMag(25);
            this.pos.add(magnetism);
        }

        this.angle += 0.1;

        if (this.pos.z > 1000) {
            this.active = false;
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);
        rotateX(this.angle);
        rotateY(this.angle);
        stroke(0, 255, 255); // Cyan
        strokeWeight(1.5);
        noFill();
        box(this.size);
        pop();
    }
}
