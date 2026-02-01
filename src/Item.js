constructor(x, y, z, type = 'GROWTH') {
    this.pos = createVector(x, y, z);
    this.vel = createVector(0, 0, 15);
    this.active = true;
    this.size = 25;
    this.angle = 0;
    this.type = type;

    if (this.type === 'GROWTH') {
        this.col = color(255, 255, 0); // Yellow
    } else if (this.type === 'LASER') {
        this.col = color(255, 0, 0); // Red
    } else if (this.type === 'HOMING') {
        this.col = color(0, 255, 0); // Green
    } else if (this.type === 'SHIELD') {
        this.col = color(0, 200, 255); // Blue/Cyan
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

    // Rotate item
    rotateY(frameCount * 0.05);
    rotateZ(frameCount * 0.05);

    fill(this.col);
    noStroke();
    box(30);

    // Label
    fill(255);
    textAlign(CENTER, CENTER);
    // Ensure text faces camera roughly or just draw simple char
    if (this.type === 'LASER') text('L', 0, 0);
    else if (this.type === 'HOMING') text('H', 0, 0);
    else if (this.type === 'GROWTH') text('P', 0, 0); // P for Power/Plus
    else if (this.type === 'SHIELD') text('S', 0, 0); // S for Shield

    pop();
}
}
