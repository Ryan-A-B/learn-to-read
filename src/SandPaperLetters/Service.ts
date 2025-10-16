import type { Vec2 } from "../lib/vec";
import Layer from "../lib/Layer";
import OffscreenLayer from "../lib/OffscreenLayer";
import { type Option, Some, None } from "../lib/Option";
import letters, { type Letter } from "./letters";
import vibrate from "../lib/vibrate";

interface Proxy {
    set_state(state: State): void;
    animate(): void;
    handle_resize(event: UIEvent): void;
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
    initialise = (proxy: Proxy, input: InitialiseInput): void => { }
    animate = (proxy: Proxy): void => { }
    handle_resize = (proxy: Proxy, event: UIEvent): void => { }
    handle_mouse_down = (proxy: Proxy, event: MouseEvent): void => { }
    handle_mouse_move = (proxy: Proxy, event: MouseEvent): void => { }
    handle_mouse_up = (proxy: Proxy, event: MouseEvent): void => { }
    handle_touch_start = (proxy: Proxy, event: TouchEvent): void => { }
    handle_touch_move = (proxy: Proxy, event: TouchEvent): void => { }
    handle_touch_end = (proxy: Proxy, event: TouchEvent): void => { }
    handle_touch_cancel = (proxy: Proxy, event: TouchEvent): void => { }
}

class NotInitialised extends AbstractState {
    readonly name = "NotInitialised";

    initialise = (proxy: Proxy, input: InitialiseInput): void => {
        const guide_layer = new Layer(input.guide_canvas);
        const drawing_layer = new Layer(input.drawing_canvas);
        const ui_layer = new Layer(input.ui_canvas);

        window.addEventListener("resize", proxy.handle_resize);
        window.addEventListener("mousedown", proxy.handle_mouse_down);
        window.addEventListener("mousemove", proxy.handle_mouse_move);
        window.addEventListener("mouseup", proxy.handle_mouse_up);
        window.addEventListener("touchstart", proxy.handle_touch_start, { passive: false });
        window.addEventListener("touchmove", proxy.handle_touch_move, { passive: false });
        window.addEventListener("touchend", proxy.handle_touch_end, { passive: false });
        window.addEventListener("touchcancel", proxy.handle_touch_cancel, { passive: false });

        const letterIndex = Math.floor(Math.random() * 26);
        const letter = letters[letterIndex];

        proxy.set_state(new Ready({
            guide_layer,
            ui_layer,
            drawing_layer,
            letter,
        }));
    }
}

interface NewReadyInput {
    guide_layer: Layer;
    ui_layer: Layer;
    drawing_layer: Layer;
    letter: Letter;
}

class Ready extends AbstractState {
    readonly name = "Ready";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;
    private readonly ui_layer: Layer;
    private readonly mask_layer: OffscreenLayer;
    private readonly refresh_button: RefreshButton;
    private readonly letter: Letter;

    constructor(input: NewReadyInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.ui_layer = input.ui_layer;
        this.letter = input.letter;
        this.mask_layer = new OffscreenLayer(new OffscreenCanvas(this.ui_layer.canvas.width, this.ui_layer.canvas.height));

        const text_align: CanvasTextAlign = "center";
        const text_baseline: CanvasTextBaseline = "middle";

        this.guide_layer.clear();
        this.guide_layer.context.textAlign = text_align;
        this.guide_layer.context.textBaseline = text_baseline;
        this.guide_layer.context.fillStyle = "#aaaaaa";

        this.mask_layer.clear();
        this.mask_layer.context.textAlign = text_align;
        this.mask_layer.context.textBaseline = text_baseline;

        const landscape = this.ui_layer.canvas.width > this.ui_layer.canvas.height;
        if (landscape) this.prepare_landscape();
        else this.prepare_portrait();

        this.ui_layer.clear();

        this.ui_layer.context.strokeStyle = "black";
        this.ui_layer.context.lineWidth = 14;
        this.ui_layer.context.lineCap = "round";

        const refresh_button_size = Math.min(this.ui_layer.canvas.width, this.ui_layer.canvas.height) / 8;
        this.refresh_button = new RefreshButton({
            layer: this.ui_layer,
            position: [
                this.ui_layer.canvas.width - refresh_button_size * 3 / 4,
                refresh_button_size * 3 / 4
            ],
            size: refresh_button_size,
        });
        this.refresh_button.render();
    }

    handle_mouse_down = (proxy: Proxy, event: MouseEvent): void => {
        const left_click = event.button === 0;
        if (!left_click) return;

        const position = this.ui_layer.get_position([event.clientX, event.clientY]);
        const hit = this.refresh_button.test_hit(position);
        if (hit) {
            const letterIndex = Math.floor(Math.random() * 26);
            const letter = letters[letterIndex];
            proxy.set_state(new Ready({
                guide_layer: new Layer(this.guide_layer.canvas),
                ui_layer: new Layer(this.ui_layer.canvas),
                drawing_layer: new Layer(this.drawing_layer.canvas),
                letter: letter,
            }));
        }

        proxy.set_state(new MouseDrawing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            ui_layer: this.ui_layer,
            refresh_button: this.refresh_button,
            mask_layer: this.mask_layer,
            letter: this.letter,
            mouse_event: event,
        }));
        proxy.animate();
    }

    handle_touch_start = (proxy: Proxy, event: TouchEvent): void => {
        event.preventDefault();
        if (event.touches.length === 0) return;

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const position = this.ui_layer.get_position([touch.clientX, touch.clientY]);
            const hit = this.refresh_button.test_hit(position);
            if (hit) {
                const letterIndex = Math.floor(Math.random() * 26);
                const letter = letters[letterIndex];
                proxy.set_state(new Ready({
                    guide_layer: new Layer(this.guide_layer.canvas),
                    ui_layer: new Layer(this.ui_layer.canvas),
                    drawing_layer: new Layer(this.drawing_layer.canvas),
                    letter: letter,
                }));
                return;
            }
        }

        proxy.set_state(new TouchDrawing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            ui_layer: this.ui_layer,
            refresh_button: this.refresh_button,
            mask_layer: this.mask_layer,
            letter: this.letter,
            touch_event: event,
        }));
        proxy.animate();
    }

    handle_resize = (proxy: Proxy, event: UIEvent): void => {
        proxy.set_state(new Ready({
            guide_layer: new Layer(this.guide_layer.canvas),
            ui_layer: new Layer(this.ui_layer.canvas),
            drawing_layer: new Layer(this.drawing_layer.canvas),
            letter: this.letter,
        }));
    }

    private prepare_landscape = (): void => {
        const font_size = Math.round(this.ui_layer.canvas.height * 0.6);
        const font = `${font_size}px monospace`;
        const text = `${this.letter.upper}${this.letter.lower}`;

        this.guide_layer.context.font = font;
        this.mask_layer.context.font = font;

        const center: Vec2 = [
            this.ui_layer.canvas.width / 2,
            this.ui_layer.canvas.height / 2
        ];
        this.guide_layer.context.fillText(text, center[0], center[1]);
        this.mask_layer.context.fillText(text, center[0], center[1]);
    }

    private prepare_portrait = (): void => {
        const font_size = Math.round(this.ui_layer.canvas.height * 15 / 36);
        const font = `${font_size}px monospace`;
        this.guide_layer.context.font = font;
        this.mask_layer.context.font = font;

        const upper_center: Vec2 = [
            this.ui_layer.canvas.width / 2,
            this.ui_layer.canvas.height * 9 / 36
        ];
        this.guide_layer.context.fillText(this.letter.upper, upper_center[0], upper_center[1]);
        this.mask_layer.context.fillText(this.letter.upper, upper_center[0], upper_center[1]);

        const lower_center: Vec2 = [
            this.ui_layer.canvas.width / 2,
            this.ui_layer.canvas.height * 23 / 36
        ];
        this.guide_layer.context.fillText(this.letter.lower, lower_center[0], lower_center[1]);
        this.mask_layer.context.fillText(this.letter.lower, lower_center[0], lower_center[1]);
    }
}

interface NewDrawingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    ui_layer: Layer;
    refresh_button: RefreshButton;
    mask_layer: OffscreenLayer;
    letter: Letter;
    position: Vec2;
}

abstract class Drawing extends AbstractState {
    protected readonly guide_layer: Layer;
    protected readonly drawing_layer: Layer;
    protected readonly ui_layer: Layer;
    protected readonly refresh_button: RefreshButton;
    protected readonly mask_layer: OffscreenLayer;
    protected readonly letter: Letter;
    protected last_position: Vec2;
    protected position: Vec2;

    constructor(input: NewDrawingInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.ui_layer = input.ui_layer;
        this.refresh_button = input.refresh_button;
        this.mask_layer = input.mask_layer;
        this.letter = input.letter;
        this.position = input.position;
        this.last_position = this.position;

        this.drawing_layer.context.lineWidth = 20;
        this.drawing_layer.context.lineCap = "round";
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
}

interface NewMouseDrawingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    ui_layer: Layer;
    refresh_button: RefreshButton;
    mask_layer: OffscreenLayer;
    letter: Letter;
    mouse_event: MouseEvent;
}

class MouseDrawing extends Drawing {
    readonly name = "MouseDrawing";

    constructor(input: NewMouseDrawingInput) {
        const position = input.drawing_layer.get_position([input.mouse_event.clientX, input.mouse_event.clientY]);
        super({
            guide_layer: input.guide_layer,
            drawing_layer: input.drawing_layer,
            ui_layer: input.ui_layer,
            refresh_button: input.refresh_button,
            mask_layer: input.mask_layer,
            letter: input.letter,
            position: position,
        });
    }

    handle_mouse_move = (proxy: Proxy, event: MouseEvent): void => {
        this.position = this.drawing_layer.get_position([event.clientX, event.clientY]);
    }

    handle_mouse_up = (proxy: Proxy, event: MouseEvent): void => {
        proxy.set_state(new Clearing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            ui_layer: this.ui_layer,
            refresh_button: this.refresh_button,
            letter: this.letter,
        }));
    }
}

interface NewTouchDrawingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    ui_layer: Layer;
    refresh_button: RefreshButton;
    mask_layer: OffscreenLayer;
    letter: Letter;
    touch_event: TouchEvent;
}

class TouchDrawing extends Drawing {
    readonly name = "TouchDrawing";
    private readonly identifier: number;

    constructor(input: NewTouchDrawingInput) {
        const touch = input.touch_event.touches[0];
        const position = input.drawing_layer.get_position([touch.clientX, touch.clientY]);
        super({
            guide_layer: input.guide_layer,
            drawing_layer: input.drawing_layer,
            ui_layer: input.ui_layer,
            refresh_button: input.refresh_button,
            mask_layer: input.mask_layer,
            letter: input.letter,
            position: position,
        });
        this.identifier = touch.identifier;
    }

    handle_touch_move = (proxy: Proxy, event: TouchEvent): void => {
        event.preventDefault();
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.touches);
        if (maybe_touch.is_none()) return;
        const touch = maybe_touch.value;
        this.position = this.drawing_layer.get_position([touch.clientX, touch.clientY]);
        return;
    }

    handle_touch_end = (proxy: Proxy, event: TouchEvent): void => {
        event.preventDefault();
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.changedTouches);
        if (maybe_touch.is_none()) return;
        proxy.set_state(new Clearing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            ui_layer: this.ui_layer,
            refresh_button: this.refresh_button,
            letter: this.letter,
        }));
    }

    handle_touch_cancel = (proxy: Proxy, event: TouchEvent): void => {
        event.preventDefault();
        const maybe_touch = TouchDrawing.get_touch_by_identifier(this.identifier, event.changedTouches);
        if (maybe_touch.is_none()) return;
        proxy.set_state(new Clearing({
            guide_layer: this.guide_layer,
            drawing_layer: this.drawing_layer,
            ui_layer: this.ui_layer,
            refresh_button: this.refresh_button,
            letter: this.letter,
        }));
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

interface NewClearingInput {
    guide_layer: Layer;
    drawing_layer: Layer;
    ui_layer: Layer;
    refresh_button: RefreshButton;
    letter: Letter;
}

class Clearing extends AbstractState {
    readonly name = "Clearing";
    private readonly guide_layer: Layer;
    private readonly drawing_layer: Layer;
    private readonly ui_layer: Layer;
    private readonly refresh_button: RefreshButton;
    private readonly letter: Letter;

    constructor(input: NewClearingInput) {
        super();
        this.guide_layer = input.guide_layer;
        this.drawing_layer = input.drawing_layer;
        this.ui_layer = input.ui_layer;
        this.refresh_button = input.refresh_button;
        this.letter = input.letter;
    }

    animate = (proxy: Proxy): void => {
        this.drawing_layer.context.clearRect(0, 0, this.ui_layer.canvas.width, this.ui_layer.canvas.height);
        proxy.set_state(new Ready({
            guide_layer: this.guide_layer,
            ui_layer: this.ui_layer,
            drawing_layer: this.drawing_layer,
            letter: this.letter,
        }));
    }
}

type State = NotInitialised | Ready | MouseDrawing | TouchDrawing | Clearing;

interface InitialiseInput {
    guide_canvas: HTMLCanvasElement;
    ui_canvas: HTMLCanvasElement;
    drawing_canvas: HTMLCanvasElement;
}

class Service {
    private state: State;
    private readonly proxy: Proxy;

    constructor() {
        this.state = new NotInitialised();
        this.proxy = {
            set_state: this.set_state,
            animate: this.animate,
            handle_resize: this.handle_resize,
            handle_mouse_down: this.handle_mouse_down,
            handle_mouse_move: this.handle_mouse_move,
            handle_mouse_up: this.handle_mouse_up,
            handle_touch_start: this.handle_touch_start,
            handle_touch_move: this.handle_touch_move,
            handle_touch_end: this.handle_touch_end,
            handle_touch_cancel: this.handle_touch_cancel,
        };
    }

    public initialise(input: InitialiseInput): void {
        this.state.initialise(this.proxy, input);
    }

    private animate = (): void => {
        this.state.animate(this.proxy);
    }

    private set_state = (state: State): void => {
        const previous_state = this.state;
        this.state = state;
        console.log(`StateChanged: from ${previous_state.name} to ${state.name}`);
    }

    private handle_resize = (event: UIEvent): void => {
        this.state.handle_resize(this.proxy, event);
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

interface NewRefreshButtonInput {
    layer: Layer;
    position: Vec2;
    size: number;
}

class RefreshButton {
    private readonly layer: Layer;
    private readonly position: Vec2;
    private readonly diameter: number;
    private readonly radius: number;
    private readonly bounding_box: [Vec2, Vec2];

    constructor(input: NewRefreshButtonInput) {
        this.layer = input.layer;
        this.position = input.position;
        this.diameter = input.size;
        this.radius = this.diameter / 2;

        this.bounding_box = [
            [this.position[0] - this.radius, this.position[1] - this.radius],
            [this.position[0] + this.radius, this.position[1] + this.radius],
        ];
    }

    render = () => {
        const angle_offset = Math.PI * 1 / 6;
        const start_angle = angle_offset;
        const end_angle = 2 * Math.PI - angle_offset;
        this.layer.context.beginPath();
        this.layer.context.arc(this.position[0], this.position[1], this.radius, start_angle, end_angle);
        this.layer.context.stroke();

        const arrow_size = this.radius * 2 / 6;
        const point_position: Vec2 = [
            this.position[0] + this.radius * Math.cos(end_angle),
            this.position[1] + this.radius * Math.sin(end_angle),
        ];
        const line_angle = Math.PI / 6;
        const line_angle_offset = Math.PI * 47 / 36;
        const line_start: Vec2 = [
            point_position[0] + arrow_size * Math.cos(line_angle_offset + line_angle),
            point_position[1] + arrow_size * Math.sin(line_angle_offset + line_angle),
        ];
        const line_end: Vec2 = [
            point_position[0] + arrow_size * Math.cos(line_angle_offset - line_angle),
            point_position[1] + arrow_size * Math.sin(line_angle_offset - line_angle),
        ];
        this.layer.context.beginPath();
        this.layer.context.moveTo(line_start[0], line_start[1]);
        this.layer.context.lineTo(point_position[0], point_position[1]);
        this.layer.context.lineTo(line_end[0], line_end[1]);
        this.layer.context.stroke();
    }

    test_hit = (point: Vec2): boolean => {
        if (point[0] < this.bounding_box[0][0]) return false;
        if (point[0] > this.bounding_box[1][0]) return false;
        if (point[1] < this.bounding_box[0][1]) return false;
        if (point[1] > this.bounding_box[1][1]) return false;
        return true;
    }
}