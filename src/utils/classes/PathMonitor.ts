import { IReloadable } from "src/interfaces/reloadable";

import { FileQueryInfoFlags, FileType } from "types/@girs/gio-2.0/gio-2.0.cjs";

import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib";

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


export enum MonitorTypeFlags {
    // only monitors the path itself
    NONE,
    // monitors all files in the path
    FILE,
    // monitors all directories in the path
    DIRECTORY,
    // monitors things inside of all subdirectoriess in the path
    RECURSIVE
};

export class PathMonitor implements IReloadable {
    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

    private _path: string;

    private _flags: MonitorTypeFlags;

    private _monitor: PathMonitorType;
    private _callback: PathMonitorCallbackType;

    isRecursive() { return MonitorTypeFlags.RECURSIVE == (this._flags & MonitorTypeFlags.RECURSIVE); }
    shouldMonitorsFiles() { return MonitorTypeFlags.FILE == (this._flags & MonitorTypeFlags.FILE); }
    shouldMonitorsDirectories() { return MonitorTypeFlags.DIRECTORY == (this._flags & MonitorTypeFlags.DIRECTORY); }
    
    constructor(path: string, flags: MonitorTypeFlags, callback: PathMonitorCallbackType) {
        this._path = path;
        this._flags = flags;
        
        this._callback = callback;
        this._monitor = undefined;
    }


    load(): void {
        if(this._loaded) return;
        this._loaded = true;

        this._monitor = monitorPath(
            this._path,
            (file, fileType, event) => {
                switch(event) {
                case Gio.FileMonitorEvent.CREATED: case Gio.FileMonitorEvent.RENAMED: case Gio.FileMonitorEvent.DELETED:
                case Gio.FileMonitorEvent.MOVED_IN: case Gio.FileMonitorEvent.MOVED_OUT:
                case Gio.FileMonitorEvent.UNMOUNTED:
                    this.cleanup();
                    this.load();
                    break;
                default: break;
                }

                if(!this.shouldMonitorsDirectories() && fileType == FileType.DIRECTORY) return;
                else if(!this.shouldMonitorsFiles() && fileType == FileType.REGULAR) return;

                this._callback(file, fileType, event);
            },
            this.isRecursive(),
            Gio.FileMonitorFlags.WATCH_HARD_LINKS | Gio.FileMonitorFlags.WATCH_MOVES | Gio.FileMonitorFlags.WATCH_MOUNTS
        );
    }

    cleanup(): void {
        if(!this._loaded) return;
        this._loaded = false;

        if(this._monitor != undefined) {
            if(this._monitor instanceof Gio.FileMonitor) {
                this._monitor.cancel();
            }
            else {
                for(const monitor of this._monitor) {
                    monitor.monitor.cancel();
                }
            }

            this._monitor = undefined;
        }
    }
};