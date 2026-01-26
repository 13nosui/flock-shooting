class WireCross {
    constructor(isLeader) {
        this.isLeader = isLeader;
        this.pos = createVector(random(-200, 200), random(-200, 200), random(-100, 100));
        this.vel = createVector(0, 0, 0);
        this.acc = createVector(0, 0, 0);
        this.size = isLeader ? 40 : 15;
        // 各個体に固有のオフセット（目標地点のバラツキ）を与える
        this.offset = p5.Vector.random3D().mult(random(100, 400));
        if (isLeader) this.offset.mult(0);

        this.followDelay = floor(random(0, 60));
        this.noiseOffset = random(10000);
    }

    // エラー修正：メソッドをクラス内に定義
    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        // Organic Idle Motion (Drift)
        let t = frameCount * 0.005; // Slow time scale
        let scale = 0.002; // Spatial scale
        let strength = 0.15; // Gentle force

        let nX = map(noise(t, this.pos.y * scale + this.noiseOffset), 0, 1, -strength, strength);
        let nY = map(noise(this.pos.x * scale + this.noiseOffset, t), 0, 1, -strength, strength);
        let nZ = map(noise(this.pos.x * scale, this.pos.y * scale, t + this.noiseOffset), 0, 1, -strength, strength);

        this.acc.add(createVector(nX, nY, nZ));

        this.vel.add(this.acc);
        this.vel.limit(this.isLeader ? 45 : 32);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.9); // 慣性

        // Constrain position to keep flock on stage
        let limitX = width * 0.6;
        let limitZ = 600; // Fixed depth range

        this.pos.x = constrain(this.pos.x, -limitX, limitX);
        this.pos.y = constrain(this.pos.y, -boundsY * 2, boundsY * 2); // Keep altitude freedom
        this.pos.z = constrain(this.pos.z, -limitZ, limitZ);
    }

    updateAsLeader() {
        score += 0.05;
    }

    flock(agents, currentTarget, history) {
        // Determine target position based on lag/history
        let targetPos = currentTarget;
        if (history && history.length > 0) {
            let index = constrain(this.followDelay, 0, history.length - 1);
            targetPos = history[index];
        }

        // 目標地点をオフセットで散らす
        let targetWithOffset = p5.Vector.add(targetPos, this.offset);
        let steer = p5.Vector.sub(targetWithOffset, this.pos);
        let d = steer.mag();

        if (d > 0) {
            let strength = map(d, 0, 800, 0.05, 2.5);
            steer.setMag(strength);
            this.acc.add(steer);
        }

        // 分離力（重なり防止）
        let sep = createVector(0, 0, 0);
        let count = 0;
        let myIdx = agents.indexOf(this);
        for (let i = 1; i < 7; i++) {
            let other = agents[(myIdx + i) % agents.length];
            let distToOther = p5.Vector.dist(this.pos, other.pos);
            if (distToOther > 1 && distToOther < 200) {
                let diff = p5.Vector.sub(this.pos, other.pos);
                diff.normalize().div(distToOther);
                sep.add(diff);
                count++;
            }
        }
        if (count > 0) {
            sep.setMag(15.0);
            this.acc.add(sep);
        }
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y, this.pos.z);

        // Organic Rotation
        let rotSpeed = 0.02;
        rotateX(frameCount * rotSpeed + this.noiseOffset);
        rotateY(frameCount * rotSpeed * 0.5 + this.noiseOffset);

        strokeWeight(this.isLeader ? 4 : 2);
        stroke(this.isLeader ? '#FF0000' : (isInverted ? 0 : 255));
        let s = this.size;
        line(-s, 0, 0, s, 0, 0);
        line(0, -s, 0, 0, s, 0);
        pop();
    }
}