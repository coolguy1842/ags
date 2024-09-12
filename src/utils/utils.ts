import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { FileQueryInfoFlags, FileType } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { Options } from "types/variable";

export function arraysEqual<T>(a: T[], b: T[]) {
    if(a === b) return true;
    if((a == null || b == null) || (a.length !== b.length)) return false;

    for(var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function getTrayItemID(item: TrayItem) {
    // hard to make unique so use all info available
    return `${item.id}-${item.title}-${item.tooltip_markup}`.replaceAll(" ", "_");
}

const systemTray = await Service.import("systemtray");
export function getActiveFavorites(favorites: string[]) {
    return systemTray.items.map(x => getTrayItemID(x)).filter(id => favorites.includes(id));
}


type PathMonitorSingleType = { path: string, monitor: Gio.FileMonitor, type: FileType };
export type PathMonitorType = (PathMonitorSingleType[]) | undefined;
export type PathMonitorCallbackType = (file: Gio.File, fileType: FileType, event: Gio.FileMonitorEvent) => void;

export function monitorPath(
    path: string,
    callback: PathMonitorCallbackType,
    recursive: boolean = false,
    flags: Gio.FileMonitorFlags = Gio.FileMonitorFlags.NONE
): PathMonitorType {
    if(!GLib.file_test(path, GLib.FileTest.EXISTS)) return undefined;

    const file = Gio.File.new_for_path(path);
    const type = file.query_file_type(FileQueryInfoFlags.NONE, null);
    const monitor = file.monitor(flags, null);

    monitor.connect("changed", (_monitor, file, _otherfile, event) => callback(file, type, event));
    
    if(!recursive || (recursive && type != FileType.DIRECTORY)) {
        return [{ path, monitor, type }];
    }

    const out: PathMonitorSingleType[] = [];
    out.push({ path: path, type: FileType.DIRECTORY, monitor: monitor });
    
    const enumerator = file.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);

    let i = enumerator.next_file(null);
    while(i) {
        const type = i.get_file_type();
        if(type == Gio.FileType.DIRECTORY) {
            const path = file.get_child(i.get_name()).get_path();
            
            if(!path) continue;
            const temp = monitorPath(path, callback, recursive, flags);
            if(temp == undefined) {
                i = enumerator.next_file(null);
                continue;
            }

            if(Array.isArray(temp)) {
                for(const mon of temp) {
                    out.push(mon);
                }
            }
            else {
                out.push(temp);
            }
        }

        i = enumerator.next_file(null);
    }

    return out;
}


export function icon(name: string | null, fallback = "image-missing-symbolic") {
    if (!name)
        return fallback || ""

    if (GLib.file_test(name, GLib.FileTest.EXISTS))
        return name

    print(`no icon for "${name}", fallback: "${fallback}"`)
    return fallback;
}


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


// code from https://gist.github.com/pushkine/fbc7cf18e0a40ffb02b3b3a20b74f4f1
/** MIT License github.com/pushkine/ */
export function generateCubicBezier(x1: number, y1: number, x2: number, y2: number) {
	if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
        throw new Error(`CubicBezier x1 & x2 values must be { 0 < x < 1 }, got { x1 : ${x1}, x2: ${x2} }`);
    }
    
	const ax = 1.0 - (x2 = 3.0 * (x2 - x1) - (x1 *= 3.0)) - x1;
	const ay = 1.0 - (y2 = 3.0 * (y2 - y1) - (y1 *= 3.0)) - y1;

	let i = 0, r = 0.0, s = 0.0, d = 0.0, x = 0.0;
	return(t: number) => {
		for(r = t, i = 0; 32 > i; i++) {
            if(1e-5 > Math.abs((x = r * (r * (r * ax + x2) + x1) - t))) {
                return r * (r * (r * ay + y2) + y1);
            }
			else if(1e-5 > Math.abs((d = r * (r * ax * 3.0 + x2 * 2.0) + x1))) {
                break;
            }

            r -= x / d;
        }

		if ((s = 0.0) > (r = t)) {
            return 0;
        }
		else if ((d = 1.0) < r) {
            return 1;
        }
		while (d > s) {
            if (1e-5 > Math.abs((x = r * (r * (r * ax + x2) + x1)) - t)) {
                break;
            }
			
            t > x ? (s = r) : (d = r), (r = 0.5 * (d - s) + s);
        }

		return r * (r * (r * ay + y2) + y1);
	};
};


export function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}  