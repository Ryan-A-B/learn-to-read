import React from 'react';
import start_animation from './start_animation';

import './styles.scss';

const SandPaperLetters: React.FunctionComponent = () => {
    const canvas1Ref = React.useRef<HTMLCanvasElement | null>(null);
    const canvas2Ref = React.useRef<HTMLCanvasElement | null>(null);

    React.useLayoutEffect(() => {
        if (canvas1Ref.current === null) throw new Error("canvas 1 not set")
        if (canvas2Ref.current === null) throw new Error("canvas 2 not set")
        start_animation({
            canvas1: canvas1Ref.current,
            canvas2: canvas2Ref.current
        });
    }, []);

    return (
        <div id="sand-paper-letters" className="viewport">
            <canvas ref={canvas1Ref}></canvas>
            <canvas ref={canvas2Ref}></canvas>
        </div>
    )
}

export default SandPaperLetters;