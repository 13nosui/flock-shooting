class Grid {
    constructor() {
        this.spacing = 100;
        this.scrollOffset = 0;
        this.gridSize = max(width, height) * 6; // Make it huge and responsive
        this.yPos = 300;
    }

    update(speed) {
        // Increment offset based on speed
        this.scrollOffset = (this.scrollOffset + speed) % this.spacing;
    }

    display(shakeAmount = 0) {
        push();
        translate(0, this.yPos, 0);
        strokeWeight(1);

        // tha-style: subtle and precise
        let col = isInverted ? color(0, 80) : color(255, 80);
        stroke(col);

        // Function to apply jitter
        const jitter = () => (shakeAmount > 0 ? random(-shakeAmount, shakeAmount) : 0);

        // Vertical lines (parallel to Z-axis)
        for (let x = -this.gridSize / 2; x <= this.gridSize / 2; x += this.spacing) {
            beginShape(LINES);
            vertex(x + jitter(), 0, -this.gridSize / 2 + jitter());
            vertex(x + jitter(), 0, this.gridSize / 2 + jitter());
            endShape();
        }

        // Horizontal lines (parallel to X-axis) - Scrolled
        for (let z = -this.gridSize / 2; z <= this.gridSize / 2; z += this.spacing) {
            let currentZ = z + this.scrollOffset;
            beginShape(LINES);
            vertex(-this.gridSize / 2 + jitter(), 0, currentZ + jitter());
            vertex(this.gridSize / 2 + jitter(), 0, currentZ + jitter());
            endShape();
        }
        pop();
    }
}
