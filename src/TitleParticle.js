class TitleParticle {
    constructor(x, y) {
        this.pos = createVector(random(-width, width), random(-height, height));
        this.target = createVector(x, y);
        this.vel = p5.Vector.random2D();
        this.acc = createVector();
        this.maxSpeed = 10;
        this.maxForce = 1;
        this.size = 3;
    }

    behaviors() {
        let arrive = this.arrive(this.target);

        // Mouse interaction (convert mouse to orthographic coords)
        let mousePos = createVector(mouseX - width / 2, mouseY - height / 2);
        let flee = this.flee(mousePos);

        arrive.mult(1);
        flee.mult(5);

        this.applyForce(arrive);
        this.applyForce(flee);
    }

    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        this.pos.add(this.vel);
        this.vel.add(this.acc);
        this.acc.mult(0);
        this.vel.mult(0.95); // Slight friction
    }

    display() {
        stroke(255);
        strokeWeight(this.size);
        point(this.pos.x, this.pos.y);
    }

    arrive(target) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        let speed = this.maxSpeed;
        if (d < 100) {
            speed = map(d, 0, 100, 0, this.maxSpeed);
        }
        desired.setMag(speed);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    }

    flee(target) {
        let desired = p5.Vector.sub(target, this.pos);
        let d = desired.mag();
        if (d < 100) {
            desired.setMag(this.maxSpeed);
            desired.mult(-1);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.maxForce);
            return steer;
        } else {
            return createVector(0, 0);
        }
    }
}
