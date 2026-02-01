class Bullet {
    constructor(x, y, z, vel, mode = 'NORMAL') {
        this.pos = createVector(x, y, z);
        this.vel = vel;
        this.mode = mode;
        this.active = true;
        this.timer = 0;
        this.penetrate = (mode === 'LASER');

        // Homing properties
        this.maxSpeed = vel.mag();
        this.steerStrength = 0.5;

        // Visuals
        if (this.mode === 'LASER') {
            this.size = 600;
            this.col = color(180, 0, 255); // Purple
        } else if (this.mode === 'HOMING') {
            this.size = 40;
            this.col = color(0, 255, 100); // Green
        } else if (this.mode === 'ENEMY') {
            // --- UPDATED: Enemy Missile (Small Orange Cube) ---
            this.size = 20;
            this.col = color(255, 100, 0); // Orange
        } else {
            this.size = 80;
            this.col = color(isInverted ? 0 : 255);
        }
    }

    update() {
        if (this.mode === 'HOMING') {
            this.homingLogic();
        }

        this.pos.add(this.vel);
        this.timer++;

        // --- FIX: Despawn Logic ---
        // Removed absolute coordinate checks to support infinite world.
        // Only remove bullet after a certain time (Lifespan).

        let lifeSpan = 200; // ~3.3 seconds
        if (this.mode === 'LASER') lifeSpan = 100; // Laser is faster, shorter life

        if (this.timer > lifeSpan) {
            this.active = false;
        }
        // --------------------------
    }

    homingLogic() {
        let nearest = null;
        let minDist = 2000;

        // Targeting obstacles
        for (let o of obstacles) {
            if (o.active && o.pos.z < this.pos.z) { // Target ahead
                let d = dist(this.pos.x, this.pos.y, this.pos.z, o.pos.x, o.pos.y, o.pos.z);
                if (d < minDist) {
                    minDist = d;
                    nearest = o;
                }
            }
        }

        if (nearest) {
            let desired = p5.Vector.sub(nearest.pos, this.pos);
            desired.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(this.steerStrength);
            this.vel.add(steer);
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        // --- ROTATION FIX ---
        // Rotate to face the direction of movement
        if (this.vel.mag() > 0.1) {
            // Calculate rotation angles
            let angleY = atan2(this.vel.x, this.vel.z);
            let angleX = -asin(this.vel.y / this.vel.mag());

            rotateY(angleY);
            rotateX(angleX);
        }
        // --------------------

        stroke(this.col);

        if (this.mode === 'LASER') {
            strokeWeight(5);
            // Draw laser slightly longer
            line(0, 0, 0, 0, 0, this.size);
        } else if (this.mode === 'HOMING') {
            strokeWeight(3);
            box(15);
        } else if (this.mode === 'ENEMY') {
            // --- UPDATED: Draw Cube ---
            strokeWeight(2);
            noFill();
            box(20); // Small cube
        } else {
            strokeWeight(1.5);
            line(0, 0, 0, 0, 0, this.size);
        }
        pop();
    }
}
