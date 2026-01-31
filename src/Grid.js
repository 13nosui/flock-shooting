class Grid {
    constructor() {
        this.spacing = 200; // Wider grid cells
        this.gridSize = 6000; // Draw distance
        this.yPos = 300;
    }

    // Removed update(), state is now driven purely by player pos in display()

    display(px, pz, shakeAmount = 0, waveStrength = 0) {
        push();
        translate(0, this.yPos, 0);
        strokeWeight(1);

        let col = isInverted ? color(0, 80) : color(255, 80);
        stroke(col);
        noFill();

        const jitter = () => (shakeAmount > 0 ? random(-shakeAmount, shakeAmount) : 0);

        // Calculate offset to snap grid
        let offsetX = px - (px % this.spacing);
        let offsetZ = pz - (pz % this.spacing);

        // Render range relative to player
        let startX = offsetX - this.gridSize / 2;
        let endX = offsetX + this.gridSize / 2;
        let startZ = offsetZ - this.gridSize / 2;
        let endZ = offsetZ + this.gridSize / 2;

        // Wave Function relative to world coordinates
        const getWaveY = (x, z) => {
            if (waveStrength === 0) return 0;
            return sin(z * 0.002 + frameCount * 0.05) * cos(x * 0.002) * waveStrength;
        };

        // 1. Lines along Z-axis (varying X)
        for (let x = startX; x <= endX; x += this.spacing) {
            beginShape();
            for (let z = startZ; z <= endZ; z += this.spacing) {
                let wy = getWaveY(x, z);
                vertex(x + jitter(), wy + jitter(), z + jitter());
            }
            endShape();
        }

        // 2. Lines along X-axis (varying Z)
        for (let z = startZ; z <= endZ; z += this.spacing) {
            beginShape();
            for (let x = startX; x <= endX; x += this.spacing) {
                let wy = getWaveY(x, z);
                vertex(x + jitter(), wy + jitter(), z + jitter());
            }
            endShape();
        }
        pop();
    }
}
