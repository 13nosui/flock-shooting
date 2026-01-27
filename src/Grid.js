class Grid {
    constructor() {
        this.spacing = 100;
        this.scrollOffset = 0;
        this.gridSize = max(width, height) * 6;
        this.yPos = 300;
    }

    update(speed) {
        this.scrollOffset = (this.scrollOffset + speed) % this.spacing;
    }

    // Updated display with wave support
    display(shakeAmount = 0, waveStrength = 0) {
        push();
        translate(0, this.yPos, 0);
        strokeWeight(1);

        let col = isInverted ? color(0, 80) : color(255, 80);
        stroke(col);
        noFill();

        const jitter = () => (shakeAmount > 0 ? random(-shakeAmount, shakeAmount) : 0);

        // Wave Function: Z-based sine wave
        const getWaveY = (z) => {
            if (waveStrength === 0) return 0;
            // Wave moves towards positive Z (front) over time
            return sin(z * 0.003 + frameCount * 0.1) * waveStrength;
        };

        let startZ = -this.gridSize / 2;
        let endZ = this.gridSize / 2;
        let startX = -this.gridSize / 2;
        let endX = this.gridSize / 2;

        // 1. Horizontal lines (Parallel to X) - Move up/down based on Z
        for (let z = startZ; z <= endZ; z += this.spacing) {
            let currentZ = z + this.scrollOffset;
            let y = getWaveY(currentZ);

            beginShape(LINES);
            vertex(startX + jitter(), y + jitter(), currentZ + jitter());
            vertex(endX + jitter(), y + jitter(), currentZ + jitter());
            endShape();
        }

        // 2. Vertical lines (Parallel to Z) - Segmented to follow the wave
        for (let x = startX; x <= endX; x += this.spacing) {
            beginShape(LINE_STRIP); // Use strip to connect segments
            for (let z = startZ; z <= endZ; z += this.spacing) {
                let currentZ = z + this.scrollOffset;
                let y = getWaveY(currentZ);
                vertex(x + jitter(), y + jitter(), currentZ + jitter());
            }
            endShape();
        }
        pop();
    }
}
