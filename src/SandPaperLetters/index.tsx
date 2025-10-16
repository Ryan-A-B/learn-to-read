import React from 'react';
import Service from './Service';

import './styles.scss';

const service = new Service();

const SandPaperLetters: React.FunctionComponent = () => {
    const guide_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);
    const drawing_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);
    const ui_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);

    React.useLayoutEffect(() => {
        if (guide_canvas_ref.current === null) throw new Error("guide canvas not set")
        if (drawing_canvas_ref.current === null) throw new Error("drawing canvas not set")
        if (ui_canvas_ref.current === null) throw new Error("ui canvas not set")
        service.initialise({
            guide_canvas: guide_canvas_ref.current,
            drawing_canvas: drawing_canvas_ref.current,
            ui_canvas: ui_canvas_ref.current,
        });
    }, []);

    return (
        <div id="sand-paper-letters" className="viewport">
            <canvas ref={guide_canvas_ref}></canvas>
            <canvas ref={drawing_canvas_ref}></canvas>
            <canvas ref={ui_canvas_ref}></canvas>
        </div>
    )
}

export default SandPaperLetters;