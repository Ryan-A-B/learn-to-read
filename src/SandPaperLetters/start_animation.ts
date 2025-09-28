import type { Option } from "../lib/Option";
import { Some, None } from "../lib/Option";
import { throttle } from "../lib/throttle";

import letters from "./letters";

const vibration_duration = 300;

type VibrateFunction = () => void;

const vibrate = ((): VibrateFunction => {
    if ("vibrate" in navigator) {
        console.log("Vibration API supported");
        return throttle(() => {
            navigator.vibrate(vibration_duration);
        }, vibration_duration);
    }
    console.log("Vibration API not supported");
    return () => { };
})();

type Vec2 = [number, number];

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
}

class OffscreenLayer {
    public readonly canvas: OffscreenCanvas;
    public readonly context: OffscreenCanvasRenderingContext2D;

    constructor(canvas: OffscreenCanvas) {
        this.canvas = canvas;
        const context = canvas.getContext("2d");
        if (context === null) throw new Error("Could not get 2D context");
        this.context = context;
    }
}

interface StartAnimationInput {
    canvas1: HTMLCanvasElement;
    canvas2: HTMLCanvasElement;
}

const start_animation = (input: StartAnimationInput) => {
    const layer1 = new Layer(input.canvas1);
    const layer2 = new Layer(input.canvas2);

    const mask_canvas = new OffscreenCanvas(layer1.canvas.width, layer1.canvas.height);
    const mask_layer = new OffscreenLayer(mask_canvas);

    const center: Vec2 = [
        layer1.canvas.width / 2,
        layer1.canvas.height / 2
    ];

    const letterIndex = Math.floor(Math.random() * 26);
    const letter = letters[letterIndex];
    const font_size = Math.round(layer1.canvas.height * 0.6);
    const offset_x = font_size * 0.5;

    layer1.context.clearRect(0, 0, layer1.canvas.width, layer1.canvas.height);
    layer1.context.font = `bold ${font_size}px sans-serif`;
    layer1.context.textAlign = "center";
    layer1.context.textBaseline = "middle";
    layer1.context.fillStyle = "#aaaaaa";
    layer1.context.fillText(letter.upper, center[0] - offset_x, center[1]);
    layer1.context.fillText(letter.lower, center[0] + offset_x, center[1]);

    mask_layer.context.clearRect(0, 0, layer1.canvas.width, layer1.canvas.height);
    mask_layer.context.font = `bold ${font_size}px sans-serif`;
    mask_layer.context.textAlign = "center";
    mask_layer.context.textBaseline = "middle";
    mask_layer.context.fillText(letter.upper, center[0] - offset_x, center[1]);
    mask_layer.context.fillText(letter.lower, center[0] + offset_x, center[1]);

    let maybe_previous_mouse_position: Option<Vec2> = new None();
    let maybe_mouse_position: Option<Vec2> = new None();

    layer2.canvas.addEventListener("mousedown", (event) => {
        maybe_mouse_position = new Some(layer2.get_position([event.clientX, event.clientY]));
    });
    layer2.canvas.addEventListener("touchstart", (event) => {
        event.preventDefault();
        if (event.touches.length === 0) return;
        const touch = event.touches[0];
        maybe_mouse_position = new Some(layer2.get_position([touch.clientX, touch.clientY]));
    }, { passive: false });

    layer2.canvas.addEventListener("mousemove", (event) => {
        event.preventDefault();
        if (maybe_mouse_position.is_none()) return;
        maybe_mouse_position = new Some(layer2.get_position([event.clientX, event.clientY]));
    }, { passive: false });
    layer2.canvas.addEventListener("touchmove", (event) => {
        if (maybe_mouse_position.is_none()) return;
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            maybe_mouse_position = new Some(layer2.get_position([touch.clientX, touch.clientY]));
        }
    });

    layer2.canvas.addEventListener("mouseup", () => {
        maybe_mouse_position = new None();
        maybe_previous_mouse_position = new None();
    });
    layer2.canvas.addEventListener("touchend", () => {
        maybe_mouse_position = new None();
        maybe_previous_mouse_position = new None();
    });
    layer2.canvas.addEventListener("touchcancel", () => {
        maybe_mouse_position = new None();
        maybe_previous_mouse_position = new None();
    });

    layer2.context.lineWidth = 20;
    layer2.context.lineCap = "round";

    const animate = () => {
        requestAnimationFrame(animate);
        if (maybe_mouse_position.is_none()) {
            layer2.context.clearRect(0, 0, layer2.canvas.width, layer2.canvas.height);
            return;
        }
        if (maybe_previous_mouse_position.is_none()) {
            maybe_previous_mouse_position = maybe_mouse_position;
            return;
        }
        const previous_mouse_position = maybe_previous_mouse_position.value;
        const mouse_position = maybe_mouse_position.value;

        const previous_miss = mask_layer.context.getImageData(previous_mouse_position[0], previous_mouse_position[1], 1, 1).data[3] === 0;
        const miss = mask_layer.context.getImageData(mouse_position[0], mouse_position[1], 1, 1).data[3] === 0;
        if (previous_miss || miss) {
            layer2.context.strokeStyle = "red";
        } else {
            layer2.context.strokeStyle = "black";
            vibrate();
        }

        layer2.context.beginPath();
        layer2.context.moveTo(previous_mouse_position[0], previous_mouse_position[1]);
        layer2.context.lineTo(mouse_position[0], mouse_position[1]);
        layer2.context.stroke();

        maybe_previous_mouse_position = maybe_mouse_position;
    }
    animate();
}

export default start_animation;
