class Grid {
    constructor() {
        this.spacing = 100;
        this.scrollOffset = 0;
        this.gridSize = 4000;
        this.yPos = 300;
    }

    update(speed) {
        // Increment offset based on speed
        this.scrollOffset = (this.scrollOffset + speed) % this.spacing;
    }

    display() {
        push();
        translate(0, this.yPos, 0);
        strokeWeight(1);

        // tha-style: subtle and precise
        let col = isInverted ? color(0, 80) : color(255, 80);
        stroke(col);

        // Vertical lines (parallel to Z-axis)
        for (let x = -this.gridSize / 2; x <= this.gridSize / 2; x += this.spacing) {
            line(x, 0, -this.gridSize / 2, x, 0, this.gridSize / 2);
        }

        // Horizontal lines (parallel to X-axis) - Scrolled
        for (let z = -this.gridSize / 2; z <= this.gridSize / 2; z += this.spacing) {
            let currentZ = z + this.scrollOffset;
            line(-this.gridSize / 2, 0, currentZ, this.gridSize / 2, 0, currentZ);
        }
        pop();
    }
}
