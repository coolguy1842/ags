import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { globals } from "src/globals";
import { PspecFlag, PspecType } from "types/utils/gobject";

import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=3.0";

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


export function icon(name: string | null, fallback: string = "image-missing-symbolic", size: number = 16) {
    const theme = globals.iconTheme ?? Gtk.IconTheme.get_default();

    // if (GLib.file_test(name, GLib.FileTest.EXISTS)) {
    //     return name;
    // }

    // print(`no icon for "${name}", fallback: "${fallback}"`);
    // return fallback;

    return theme.lookup_icon(
        name,
        size,
        Gtk.IconLookupFlags.USE_BUILTIN,
    ) ?? theme.lookup_icon(
        theme.get_example_icon_name(),
        size,
        Gtk.IconLookupFlags.USE_BUILTIN | Gtk.IconLookupFlags.GENERIC_FALLBACK
    )!;
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

export function registerObject<
    Obj extends { new(...args: any[]): GObject.Object },
    Config extends {
        typename?: string,
        signals?: { [signal: string]: PspecType[] },
        properties?: { [prop: string]: [type?: PspecType, handle?: PspecFlag] },
        cssName?: string,
    },
>(object: Obj, config?: Config) {
    // include date to allow for hotreloading with custom gobjects
    const typeName = config?.typename ?? `Coolguy_Ags_${object.name}_${Date.now()}`;
    if(!config) {
        config = { typename: typeName } as Config;
    }
    else {
        config.typename = typeName;
    }

    registerGObject(object, config);
}

export function copyObject<T extends {}>(obj: T): T {
    return Object.assign({}, obj);
}