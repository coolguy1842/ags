import GLib from "gi://GLib?version=2.0";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { globals } from "src/globals";

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
    // TODO: tooltip_markup can change, must find a better way for unique ids
    return `${item.id}-${item.title}-${item.menu?.dbusObject}-${item.tooltip_markup}`.replaceAll(" ", "_");
}

const systemTray = await Service.import("systemtray");
export function getActiveFavorites(favorites: string[]) {
    return systemTray.items.map(x => getTrayItemID(x)).filter(id => favorites.includes(id));
}


export function icon(name: string | null, fallback = "image-missing-symbolic") {
    if (!name) {
        return fallback ?? "";
    }

    if (GLib.file_test(name, GLib.FileTest.EXISTS)) {
        return name;
    }

    print(`no icon for "${name}", fallback: "${fallback}"`);
    return fallback;
}

export function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export function splitToNChunks<T>(array: T[], n: number) {
    let out: T[][] = [];
    for(var i = 0; i < array.length; i += n) {
        out.push(array.slice(i, i + n));
    }

    return out;
}

const hyprland = await Service.import("hyprland");
export function getCurrentMonitor() {
    // only hyprland
    const monitor = hyprland.monitors.find(x => x.focused);
    if(monitor == undefined) return 0;

    globals.loadMonitorLookups();

    if(!globals.monitorLookups) return 0;
    return globals.monitorLookups[monitor.name] ?? monitor.id;
}