type TEventData<Data extends {}> = Data;
type TRegisteredEvent = { event: string, callback: (data: any) => void, singleUse: boolean };
type TRegisteredMultiEvent = { events: string[], callbacks: { [event: string]: (data: any) => void }, singleUse: boolean };

export class EventHandler<Events extends { [name: string]: TEventData<any> }> {
    private _registeredEvents: { [key: number]: TRegisteredEvent};
    private _registeredMultiEvents: { [key: number]: TRegisteredMultiEvent};

    private _nextEventID: number;

    constructor() {
        this._registeredEvents = {};
        this._registeredMultiEvents = {};

        this._nextEventID = 0;
    }


    private registerEvent<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void, singleUse: boolean = false) {
        this._registeredEvents[this._nextEventID] = { event, callback, singleUse };
        return this._nextEventID++;
    }

    private registerMultiEvent<K extends keyof Events, E extends { [key in K]: (data: Events[K]) => void }>(events: E, singleUse: boolean = false) {
        if(Object.keys(events).length <= 0) return -1;

        this._registeredMultiEvents[this._nextEventID] = { events: Object.keys(events), callbacks: events, singleUse };
        return this._nextEventID++;
    }


    protected emit<K extends (string & keyof Events)>(event: K, data: Events[K]) {
        for(const id of Object.keys(this._registeredEvents)) {
            const eventInfo = this._registeredEvents[id] as TRegisteredEvent;
            if(eventInfo == undefined || eventInfo.event != event) {
                continue;
            }

            eventInfo.callback(data);
            if(eventInfo.singleUse) {
                delete this._registeredEvents[id];
            }
        }

        for(const id of Object.keys(this._registeredMultiEvents)) {
            const eventInfo = this._registeredMultiEvents[id] as TRegisteredMultiEvent;
            if(eventInfo == undefined || !eventInfo.events.includes(event)) {
                continue;
            }

            eventInfo.callbacks[event](data);
            if(eventInfo.singleUse) {
                delete this._registeredMultiEvents[id];
            }
        }
    }

    on<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void) { return this.registerEvent(event, callback); }
    once<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void) { return this.registerEvent(event, callback, true); }

    onMulti<K extends keyof Events, E extends { [key in K]?: (data: Events[K]) => void }>(events: E) { return this.registerMultiEvent(events as any); }
    onceMulti<K extends keyof Events, E extends { [key in K]?: (data: Events[K]) => void }>(events: E) { return this.registerMultiEvent(events as any, true); }


    unregister(id: number) {
        if(this._registeredEvents[id] != undefined) delete this._registeredEvents[id];
        if(this._registeredMultiEvents[id] != undefined) delete this._registeredMultiEvents[id];
    }

    // shouldnt use this function unless cleaning up
    unregisterAll() {
        for(const id of Object.keys(this._registeredEvents)) {
            if(this._registeredEvents[id] == undefined) continue;
            delete this._registeredEvents[id];
        }

        for(const id of Object.keys(this._registeredMultiEvents)) {
            if(this._registeredMultiEvents[id] == undefined) continue;
            delete this._registeredMultiEvents[id];
        }
    }
}