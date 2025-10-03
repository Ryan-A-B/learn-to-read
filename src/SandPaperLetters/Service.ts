// 1. Initialise
// 2. Animate
// 3. Handle mouse down
// 4. Handle mouse move
// 5. Handle mouse up
// 6. Handle touch events

import type { Vec2 } from "../lib/vec";
import Layer from "../lib/Layer";
import OffscreenLayer from "../lib/OffscreenLayer";
import { type Option, Some, None } from "../lib/Option";
import letters from "./letters";
import vibrate from "../lib/vibrate";

interface Proxy {
    set_state(state: State): void;
    animate(): void;
    handle_mouse_down(event: MouseEvent): void;
    handle_mouse_move(event: MouseEvent): void;
    handle_mouse_up(event: MouseEvent): void;
    handle_touch_start(event: TouchEvent): void;
    handle_touch_move(event: TouchEvent): void;
    handle_touch_end(event: TouchEvent): void;
    handle_touch_cancel(event: TouchEvent): void;
}

abstract class AbstractState {
    abstract readonly name: string;
    abstract initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void;
    abstract animate(proxy: Proxy): void
    abstract handle_mouse_down(proxy: Proxy, event: MouseEvent): void;
    abstract handle_mouse_move(proxy: Proxy, event: MouseEvent): void;
    abstract handle_mouse_up(proxy: Proxy, event: MouseEvent): void;
    abstract handle_touch_start(proxy: Proxy, event: TouchEvent): void;
    abstract handle_touch_move(proxy: Proxy, event: TouchEvent): void;
    abstract handle_touch_end(proxy: Proxy, event: TouchEvent): void;
    abstract handle_touch_cancel(proxy: Proxy, event: TouchEvent): void;
}

class NotInitialised extends AbstractState {
    readonly name = "NotInitialised";

    initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        const guide_layer = new Layer(canvas[0]);
        const drawing_layer = new Layer(canvas[1]);

        drawing_layer.canvas.addEventListener("mousedown", proxy.handle_mouse_down);
        drawing_layer.canvas.addEventListener("mousemove", proxy.handle_mouse_move);
        drawing_layer.canvas.addEventListener("mouseup", proxy.handle_mouse_up);
        drawing_layer.canvas.addEventListener("touchstart", proxy.handle_touch_start, { passive: false });
        drawing_layer.canvas.addEventListener("touchmove", proxy.handle_touch_move, { passive: false });
        drawing_layer.canvas.addEventListener("touchend", proxy.handle_touch_end);
        drawing_layer.canvas.addEventListener("touchcancel", proxy.handle_touch_cancel);

        proxy.set_state(new Ready({
            guide_layer: guide_layer,
            drawing_layer: drawing_layer,
        }));
    }

    animate(proxy: Proxy): void { }
    handle_mouse_down(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_move(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_up(proxy: Proxy, event: MouseEvent): void { }
    handle_touch_start(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_move(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_end(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_cancel(proxy: Proxy, event: TouchEvent): void { }
}

interface NewReadyInput {
    guide_layer: Layer;
    drawing_layer: Layer;
}

class Ready extends AbstractState {
    readonly name = "Ready";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;
    private readonly mask_layer: OffscreenLayer;

    constructor(input: NewReadyInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.mask_layer = new OffscreenLayer(new OffscreenCanvas(this.guide_layer.canvas.width, this.guide_layer.canvas.height));

        const letterIndex = Math.floor(Math.random() * 26);
        const letter = letters[letterIndex];
        const font_size = Math.round(this.guide_layer.canvas.height * 0.6);

        const center: Vec2 = [
            this.guide_layer.canvas.width / 2,
            this.guide_layer.canvas.height / 2
        ];

        const font = `bold ${font_size}px sans-serif`;
        const text_align = "center";
        const text_baseline = "middle";
        const text = `${letter.upper} ${letter.lower}`;

        this.guide_layer.clear();
        this.guide_layer.context.font = font;
        this.guide_layer.context.textAlign = text_align;
        this.guide_layer.context.textBaseline = text_baseline;
        this.guide_layer.context.fillStyle = "#aaaaaa";
        this.guide_layer.context.fillText(text, center[0], center[1]);

        this.mask_layer.clear();
        this.mask_layer.context.font = font;
        this.mask_layer.context.textAlign = text_align;
        this.mask_layer.context.textBaseline = text_baseline;
        this.mask_layer.context.fillText(text, center[0], center[1]);
    }

    initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        console.warn("Already initialised");
    }

    animate(proxy: Proxy): void { }

    handle_mouse_down(proxy: Proxy, event: MouseEvent): void {
        proxy.set_state(new MouseDrawing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            mask_layer: this.mask_layer,
            mouse_event: event,
        }));
        proxy.animate();
    }

    handle_mouse_move(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_up(proxy: Proxy, event: MouseEvent): void { }

    handle_touch_start(proxy: Proxy, event: TouchEvent): void {
        if (event.touches.length === 0) return;
        const touch = event.touches[0];
        proxy.set_state(new TouchDrawing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            mask_layer: this.mask_layer,
            touch_event: event,
        }));
        proxy.animate();
    }

    handle_touch_move(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_end(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_cancel(proxy: Proxy, event: TouchEvent): void { }
}

interface NewMouseDrawingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    mask_layer: OffscreenLayer;
    mouse_event: MouseEvent;
}

class MouseDrawing extends AbstractState {
    readonly name = "MouseDrawing";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;
    private readonly mask_layer: OffscreenLayer;
    private last_position: Vec2;
    private position: Vec2;

    constructor(input: NewMouseDrawingInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.drawing_layer.context.lineWidth = 20;
        this.drawing_layer.context.lineCap = "round";
        this.mask_layer = input.mask_layer;

        this.position = this.drawing_layer.get_position([input.mouse_event.clientX, input.mouse_event.clientY]);
        this.last_position = this.position;
    }

    initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        console.warn("Already initialised");
    }

    animate = (proxy: Proxy): void => {
        requestAnimationFrame(proxy.animate);

        const previous_miss = this.mask_layer.context.getImageData(this.last_position[0], this.last_position[1], 1, 1).data[3] === 0;
        const miss = this.mask_layer.context.getImageData(this.position[0], this.position[1], 1, 1).data[3] === 0;
        if (previous_miss || miss) {
            this.drawing_layer.context.strokeStyle = "red";
        } else {
            this.drawing_layer.context.strokeStyle = "black";
            vibrate();
        }

        this.drawing_layer.context.beginPath();
        this.drawing_layer.context.moveTo(this.last_position[0], this.last_position[1]);
        this.drawing_layer.context.lineTo(this.position[0], this.position[1]);
        this.drawing_layer.context.stroke();
        this.last_position = this.position;
    }

    handle_mouse_down(proxy: Proxy, event: MouseEvent): void { }

    handle_mouse_move = (proxy: Proxy, event: MouseEvent): void => {
        this.position = this.drawing_layer.get_position([event.clientX, event.clientY]);
    }

    handle_mouse_up = (proxy: Proxy, event: MouseEvent): void => {
        proxy.set_state(new Clearing(this.guide_layer, this.drawing_layer));
    }

    handle_touch_start(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_move = (proxy: Proxy, event: TouchEvent): void => { }
    handle_touch_end = (proxy: Proxy, event: TouchEvent): void => { }
    handle_touch_cancel = (proxy: Proxy, event: TouchEvent): void => { }
}

interface NewTouchDrawingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    mask_layer: OffscreenLayer;
    touch_event: TouchEvent;
}

class TouchDrawing extends AbstractState {
    readonly name = "TouchDrawing";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;
    private readonly mask_layer: OffscreenLayer;
    private readonly identifier: number;
    private last_position: Vec2;
    private position: Vec2;

    constructor(input: NewTouchDrawingInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.drawing_layer.context.lineWidth = 20;
        this.drawing_layer.context.lineCap = "round";
        this.mask_layer = input.mask_layer;

        const touch = input.touch_event.touches[0];
        this.identifier = touch.identifier;
        this.position = this.drawing_layer.get_position([touch.clientX, touch.clientY]);
        this.last_position = this.position;
    }

    initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        console.warn("Already initialised");
    }

    animate = (proxy: Proxy): void => {
        requestAnimationFrame(proxy.animate);

        const previous_miss = this.mask_layer.context.getImageData(this.last_position[0], this.last_position[1], 1, 1).data[3] === 0;
        const miss = this.mask_layer.context.getImageData(this.position[0], this.position[1], 1, 1).data[3] === 0;
        if (previous_miss || miss) {
            this.drawing_layer.context.strokeStyle = "red";
        } else {
            this.drawing_layer.context.strokeStyle = "black";
            vibrate();
        }

        this.drawing_layer.context.beginPath();
        this.drawing_layer.context.moveTo(this.last_position[0], this.last_position[1]);
        this.drawing_layer.context.lineTo(this.position[0], this.position[1]);
        this.drawing_layer.context.stroke();
        this.last_position = this.position;
    }

    handle_mouse_down(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_move = (proxy: Proxy, event: MouseEvent): void => { }
    handle_mouse_up = (proxy: Proxy, event: MouseEvent): void => { }
    handle_touch_start(proxy: Proxy, event: TouchEvent): void { }

    handle_touch_move = (proxy: Proxy, event: TouchEvent): void => {
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.touches);
        if (maybe_touch.is_none()) return;
        const touch = maybe_touch.value;
        this.position = this.drawing_layer.get_position([touch.clientX, touch.clientY]);
        return;
    }

    handle_touch_end = (proxy: Proxy, event: TouchEvent): void => {
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.changedTouches);
        if (maybe_touch.is_none()) return;
        proxy.set_state(new Clearing(this.guide_layer, this.drawing_layer));
    }

    handle_touch_cancel = (proxy: Proxy, event: TouchEvent): void => {
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.changedTouches);
        if (maybe_touch.is_none()) return;
        proxy.set_state(new Clearing(this.guide_layer, this.drawing_layer));
    }

    private static get_touch_by_identifier = (identifier: number, touches: TouchList): Option<Touch> => {
        for (let i = 0; i < touches.length; i++) {
            if (touches[i].identifier === identifier) {
                return new Some(touches[i]);
            }
        }
        return new None();
    }
}

class Clearing extends AbstractState {
    readonly name = "Clearing";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;

    constructor(guide_layer: Layer, drawing_layer: Layer) {
        super();
        this.guide_layer = guide_layer;
        this.drawing_layer = drawing_layer;
    }

    initialise(proxy: Proxy, canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        console.warn("Already initialised");
    }

    animate = (proxy: Proxy): void => {
        this.drawing_layer.context.clearRect(0, 0, this.drawing_layer.canvas.width, this.drawing_layer.canvas.height);
        proxy.set_state(new Ready({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
        }));
    }

    handle_mouse_down(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_move(proxy: Proxy, event: MouseEvent): void { }
    handle_mouse_up(proxy: Proxy, event: MouseEvent): void { }
    handle_touch_start(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_move(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_end(proxy: Proxy, event: TouchEvent): void { }
    handle_touch_cancel(proxy: Proxy, event: TouchEvent): void { }
}

type State = NotInitialised | Ready | MouseDrawing | TouchDrawing | Clearing;

class Service {
    private state: State;
    private readonly proxy: Proxy;

    constructor() {
        this.state = new NotInitialised();
        this.proxy = {
            set_state: this.set_state,
            animate: this.animate,
            handle_mouse_down: this.handle_mouse_down,
            handle_mouse_move: this.handle_mouse_move,
            handle_mouse_up: this.handle_mouse_up,
            handle_touch_start: this.handle_touch_start,
            handle_touch_move: this.handle_touch_move,
            handle_touch_end: this.handle_touch_end,
            handle_touch_cancel: this.handle_touch_cancel,
        };
    }

    public initialise(canvas: [HTMLCanvasElement, HTMLCanvasElement]): void {
        this.state.initialise(this.proxy, canvas);
    }

    private animate = (): void => {
        this.state.animate(this.proxy);
    }

    private set_state = (state: State): void => {
        const previous_state = this.state;
        this.state = state;
        console.log(`StateChanged: from ${previous_state.name} to ${state.name}`);
    }

    private handle_mouse_down = (event: MouseEvent): void => {
        this.state.handle_mouse_down(this.proxy, event);
    }

    private handle_mouse_move = (event: MouseEvent): void => {
        this.state.handle_mouse_move(this.proxy, event);
    }

    private handle_mouse_up = (event: MouseEvent): void => {
        this.state.handle_mouse_up(this.proxy, event);
    }

    private handle_touch_start = (event: TouchEvent): void => {
        this.state.handle_touch_start(this.proxy, event);
    }

    private handle_touch_move = (event: TouchEvent): void => {
        this.state.handle_touch_move(this.proxy, event);
    }

    private handle_touch_end = (event: TouchEvent): void => {
        this.state.handle_touch_end(this.proxy, event);
    }

    private handle_touch_cancel = (event: TouchEvent): void => {
        this.state.handle_touch_cancel(this.proxy, event);
    }
}

export default Service;