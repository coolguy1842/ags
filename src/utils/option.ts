import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

export class Option<T = unknown> extends Variable<T> {
    static { registerGObject(this, { typename: `Ags_Option_${Date.now()}` }); }

    private _persistent;

    constructor(initial: T, persistent: boolean = true) {
        super(initial);

        this._persistent = persistent;
    }

    get persistent() { return this._persistent; }


    toJSON() {
        return `{ "option": ${JSON.stringify(this.value)} }`;
    }

    toString() {
        return this.toJSON();
    }
}

export const option = <T>(initial: T, persistent: boolean = true) => new Option(initial, persistent);
