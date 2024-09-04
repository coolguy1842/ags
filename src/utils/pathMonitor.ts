import Gio from "gi://Gio?version=2.0";
import { IReloadable } from "src/interfaces/reloadable";
import { monitorPath, PathMonitorCallbackType, PathMonitorType } from "./utils";
import { FileType } from "types/@girs/gio-2.0/gio-2.0.cjs";

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
    private _path: string;
    private _loaded: boolean = false;

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