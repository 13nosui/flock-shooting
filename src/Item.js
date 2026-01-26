class Item {
    constructor(x, y, z, type = 'GROWTH') {
        this.pos = createVector(x, y, z);
        this.vel = createVector(0, 0, 15);
        this.active = true;
        this.size = 25;
        this.angle = 0;
        this.type = type;

        if (this.type === 'GROWTH') {
            this.col = color(0, 255, 255); // Cyan
        } else if (this.type === 'LASER') {
            this.col = color(180, 0, 255); // Purple
        } else if (this.type === 'HOMING') {
            this.col = color(0, 255, 100); // Neon Green
        }
    }

    update(leaderPos) {
        this.pos.add(this.vel);

        // Magnetism
        let d = dist(this.pos.x, this.pos.y, this.pos.z, leaderPos.x, leaderPos.y, leaderPos.z);
        if (d < 500) {
            let magnetism = p5.Vector.sub(leaderPos, this.pos);
            magnetism.setMag(30);
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
        rotateY(this.angle * 1.5);
        stroke(this.col);
        strokeWeight(2);
        noFill();

        if (this.type === 'GROWTH') {
            box(this.size);
        } else if (this.type === 'LASER') {
            cone(this.size, this.size, 4);
        } else if (this.type === 'HOMING') {
            sphere(this.size, 4, 4);
        }
        pop();
    }
}
