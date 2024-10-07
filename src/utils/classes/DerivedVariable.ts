import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

export class DerivedVariable<
    V,
    const Deps extends Variable<any>[],
    Args extends { [K in keyof Deps]: Deps[K] extends Variable<infer T> ? T : never }
> extends Variable<V> {
    static {
        registerGObject(this, {
            typename: `Ags_OptionsHandler_${Date.now()}`,
            signals: {},
            properties: {
                'value': ['jsobject', 'rw'],
                'is-listening': ['boolean', 'r'],
                'is-polling': ['boolean', 'r'],
            }
        });
    }


    private _deps: Deps;
    private _fn: (...args: Args) => V;

    private _listeners: {
        [ key: number ]: number
    }

    private _update(deps: Deps, fn: (...args: Args) => V) {
        return fn(...deps.map(d => d.value) as Args);
    }
    
    constructor(deps: Deps, fn: (...args: Args) => V) {
        super(fn(...deps.map(d => d.value) as Args));

        this._deps = deps;
        this._fn = fn;

        this._listeners = {};
        for(const i in this._deps) {
            const dep = this._deps[i];

            this._listeners[i] = dep.connect('changed', () => this.value = this._update(this._deps, this._fn));
        }
    }

    stop() {
        for(const i in this._deps) {
            const dep = this._deps[i];

            dep.disconnect(this._listeners[i]);
        }
    }
}