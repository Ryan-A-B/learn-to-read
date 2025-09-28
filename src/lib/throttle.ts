export function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
    let lastCall = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: any;

    return function(this: any, ...args: any[]) {
        const now = Date.now();
        lastArgs = args;

        const invoke = () => {
            lastCall = now;
            fn.apply(this, lastArgs);
            timeout = null;
        };

        if (!lastCall || now - lastCall >= wait) {
            invoke();
        } else if (!timeout) {
            timeout = setTimeout(invoke, wait - (now - lastCall));
        }
    } as T;
}