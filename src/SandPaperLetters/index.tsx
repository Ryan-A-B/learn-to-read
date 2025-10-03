import React from 'react';
import start_animation from './start_animation';

import './styles.scss';

const SandPaperLetters: React.FunctionComponent = () => {
    const guide_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);
    const drawing_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);

    React.useLayoutEffect(() => {
        if (guide_canvas_ref.current === null) throw new Error("canvas 1 not set")
        if (drawing_canvas_ref.current === null) throw new Error("canvas 2 not set")
            start_animation({
                canvas1: guide_canvas_ref.current,
                canvas2: drawing_canvas_ref.current
            });
    }, []);

    return (
        <div id="sand-paper-letters" className="viewport">
            <canvas ref={guide_canvas_ref}></canvas>
            <canvas ref={drawing_canvas_ref}></canvas>
        </div>
    )
}

export default SandPaperLetters;