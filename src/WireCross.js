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
    }

    // エラー修正：メソッドをクラス内に定義
    applyForce(f) {
        this.acc.add(f);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.isLeader ? 45 : 32);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.vel.mult(0.9); // 慣性

        this.pos.x = constrain(this.pos.x, -boundsX * 1.8, boundsX * 1.8);
        this.pos.y = constrain(this.pos.y, -boundsY * 1.8, boundsY * 1.8);
    }

    updateAsLeader() {
        score += 0.05;
    }

    flock(agents, target) {
        // 目標地点をオフセットで散らす
        let targetWithOffset = p5.Vector.add(target, this.offset);
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
        strokeWeight(this.isLeader ? 4 : 2);
        stroke(this.isLeader ? '#FF0000' : (isInverted ? 0 : 255));
        let s = this.size;
        line(-s, 0, 0, s, 0, 0);
        line(0, -s, 0, 0, s, 0);
        pop();
    }
}