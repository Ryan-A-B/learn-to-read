import type { Vec2 } from "../lib/vec";
import Layer from "../lib/Layer";
import OffscreenLayer from "../lib/OffscreenLayer";
import type { Option } from "../lib/Option";
import { Some, None } from "../lib/Option";

import letters from "./letters";
import vibrate from "../lib/vibrate";

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

    const font = `bold ${font_size}px sans-serif`;
    const text_align = "center";
    const text_baseline = "middle";
    const text = `${letter.upper} ${letter.lower}`;

    layer1.context.clearRect(0, 0, layer1.canvas.width, layer1.canvas.height);
    layer1.context.font = font;
    layer1.context.textAlign = text_align;
    layer1.context.textBaseline = text_baseline;
    layer1.context.fillStyle = "#aaaaaa";
    layer1.context.fillText(text, center[0], center[1]);

    mask_layer.context.clearRect(0, 0, layer1.canvas.width, layer1.canvas.height);
    mask_layer.context.font = font;
    mask_layer.context.textAlign = text_align;
    mask_layer.context.textBaseline = text_baseline;
    mask_layer.context.fillText(text, center[0], center[1]);

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
