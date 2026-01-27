class MidBoss {
    constructor() {
        this.pos = createVector(0, 0, -4000);
        this.targetZ = -1200;
        this.hp = 150;
        this.maxHp = 150;
        this.active = true;
        this.fireTimer = 0;
        this.wingAngle = 0;
    }

    update() {
        // Approach
        if (this.pos.z < this.targetZ) this.pos.z += 8;

        // Hover Motion
        this.pos.x = sin(frameCount * 0.02) * 300;
        this.pos.y = cos(frameCount * 0.03) * 100 - 200;

        // Attack
        this.fireTimer++;
        if (this.fireTimer > 80) {
            this.fire();
            this.fireTimer = 0;
        }
    }

    fire() {
        // 3-Way Shot
        let target = createVector(0, 0, 500); // Rough player direction
        if (typeof leader !== 'undefined') target = leader.pos.copy();

        let dir = p5.Vector.sub(target, this.pos);
        let speed = 40;

        for (let angle of [-0.2, 0, 0.2]) {
            let d = dir.copy();
            let ang = atan2(d.x, d.z) + angle;
            d.x = sin(ang) * d.mag();
            d.z = cos(ang) * d.mag();
            d.setMag(speed);

            if (typeof enemyBullets !== 'undefined') {
                if (typeof enemyFireSound === 'function') enemyFireSound();
                enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.z + 100, d, 'ENEMY'));
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        // --- INSECT DESIGN ---
        stroke(100, 255, 100); // Toxic Green
        strokeWeight(2);
        noFill();

        // Head
        push();
        translate(0, -30, 80);
        box(50, 40, 50);
        pop();

        // Thorax (Body)
        box(80, 60, 100);

        // Abdomen (Tail)
        push();
        translate(0, 10, -100);
        rotateX(-0.2);
        box(70, 50, 120);
        pop();

        // Wings
        let flap = sin(frameCount * 0.8) * 0.5;
        // Left Wing
        push();
        translate(-40, -30, 20);
        rotateZ(-flap + 0.5);
        strokeWeight(1);
        fill(100, 255, 100, 30);
        box(180, 10, 80);
        pop();
        // Right Wing
        push();
        translate(40, -30, 20);
        rotateZ(flap - 0.5);
        strokeWeight(1);
        fill(100, 255, 100, 30);
        box(180, 10, 80);
        pop();

        // --- HP BAR ---
        push();
        translate(0, -150, 0);
        noStroke();
        fill(50);
        rect(-60, -5, 120, 10); // BG
        fill(255, 50, 50);
        let hpW = map(this.hp, 0, this.maxHp, 0, 120);
        rect(-60, -5, hpW, 10); // HP
        stroke(255);
        noFill();
        rect(-60, -5, 120, 10); // Frame
        pop();

        pop();
    }
}
