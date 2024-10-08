type TEventData<Data extends {}> = Data;
type TRegisteredEvent = { event: string, callback: (data: any) => void, singleUse: boolean };

export class EventHandler<Events extends { [name: string]: TEventData<any> }> {
    private _registeredEvents: { [key: number]: TRegisteredEvent};
    private _nextEventID: number;

    constructor() {
        this._registeredEvents = {};
        this._nextEventID = 0;
    }


    private registerEvent<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void, singleUse: boolean = false) {
        this._registeredEvents[this._nextEventID] = { event, callback, singleUse };
        return this._nextEventID++;
    }

    protected emit<K extends (string & keyof Events)>(event: K, data: Events[K]) {
        for(const id of Object.keys(this._registeredEvents)) {
            const eventInfo = this._registeredEvents[id];
            if(eventInfo == undefined || eventInfo.event != event) {
                continue;
            }

            eventInfo.callback(data);
            if(eventInfo.singleUse) {
                delete this._registeredEvents[id];
            }
        }
    }

    on<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void) { return this.registerEvent(event, callback); }
    once<K extends (string & keyof Events)>(event: K, callback: (data: Events[K]) => void) { return this.registerEvent(event, callback, true); }


    unregister(id: number) {
        if(this._registeredEvents[id] == undefined) return;
        delete this._registeredEvents[id];
    }

    // shouldnt use this function unless cleaning up
    unregisterAll() {
        for(const id of Object.keys(this._registeredEvents)) {
            if(this._registeredEvents[id] == undefined) continue;
            delete this._registeredEvents[id];
        }
    }
}