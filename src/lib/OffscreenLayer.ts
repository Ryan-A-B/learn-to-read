

class OffscreenLayer {
    public readonly canvas: OffscreenCanvas;
    public readonly context: OffscreenCanvasRenderingContext2D;

    constructor(canvas: OffscreenCanvas) {
        this.canvas = canvas;
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("Could not get 2D context");
        this.context = context;
    }

    public clear = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default OffscreenLayer;