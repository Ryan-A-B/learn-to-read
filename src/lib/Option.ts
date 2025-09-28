


export class Some<T> {
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    public is_some = (): this is Some<T> => true;
    public is_none = (): this is None => false;
}

export class None { 
    public is_some = (): this is Some<never> => false;
    public is_none = (): this is None => true;
}

export type Option<T> = Some<T> | None;
