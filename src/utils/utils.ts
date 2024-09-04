import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { FileQueryInfoFlags, FileType } from "types/@girs/gio-2.0/gio-2.0.cjs";

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
