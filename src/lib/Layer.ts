import type { Vec2 } from "./vec";

class Layer {
    public readonly canvas: HTMLCanvasElement;
    public readonly context: CanvasRenderingContext2D;
    public readonly bounding_client_rect: DOMRect;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("Could not get 2D context");
        this.context = context;
        this.bounding_client_rect = this.canvas.getBoundingClientRect();
    }

    public get_position = (client_position: Vec2): Vec2 => {
        return [
            this.canvas.width * client_position[0] / this.bounding_client_rect.width,
            this.canvas.height * client_position[1] / this.bounding_client_rect.height
        ];
    }

    public clear = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default Layer;