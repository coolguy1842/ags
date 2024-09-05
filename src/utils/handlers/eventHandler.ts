export type Events = {
    [eventMame: string]: {
        [param: string]: any
    }
};

export class EventHandler<EventsT extends Events> {
    private _events: (keyof EventsT)[];
    private _listeners: { [key in keyof EventsT]?: ((event: string, data: EventsT[key]) => void)[] };

    protected reloadListeners() {
        this._listeners = {};
        for(const key of this._events) {
            this._listeners[key] = [];
        }
    }

    on<T extends keyof EventsT>(event: T, callback: (event: string, data: EventsT[T]) => void) {
        this._listeners[event]!.push(callback);
    }

    removeListener<T extends keyof EventsT>(event: T, callback: (event: string, data: EventsT[T]) => void) {
        this._listeners[event] = this._listeners[event]!.filter(x => x !== callback);
    }

    getListeners<T extends keyof EventsT>(event: T) {
        return this._listeners[event]!;
    }

    getAllListeners() {
        return this._listeners;
    }

    setListeners(listeners: typeof this._listeners) {
        this._listeners = listeners;
    }

    protected emit<T extends keyof EventsT>(event: T, data: EventsT[T]) {
        for(const listener of this._listeners[event]!) {
            listener(event as string, data);
        }
    }


    constructor(events: (keyof EventsT)[]) {
        this._events = events;
        this._listeners = {};

        this.reloadListeners();
    }
};