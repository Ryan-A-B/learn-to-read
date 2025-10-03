import { throttle } from "../lib/throttle";

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

export default vibrate;