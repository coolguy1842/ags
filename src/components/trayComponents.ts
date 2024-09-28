import { globals } from "src/globals";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { TrayType } from "src/bar/enums/trayType";
import { getTrayItemID } from "src/utils/utils";
import { Binding } from "types/service";
import Box from "types/widgets/box";

import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk?version=3.0";

const tray = await Service.import("systemtray");

export function trayButton(item: TrayItem, iconSize: number | Binding<any, any, number>, onMiddleClick: (item: TrayItem) => void) {
    return Widget.Button({
        classNames: [ "bar-system-tray-item", `bar-system-tray-item-id-${getTrayItemID(item)}` ],
        child: Widget.Icon({
            size: iconSize,
            icon: item.bind("icon")
        }),
        onPrimaryClick: (self, event) => {
            item.activate(event);
        },
        onSecondaryClick: (self, event) => {
            item.menu?.popup_at_widget(self, Gdk.Gravity.CENTER, Gdk.Gravity.SOUTH_WEST, event);
        },
        onMiddleClick: () => onMiddleClick(item)
    })
}

export function updateTray(trayBox: Box<Gtk.Widget, unknown>, trayType: TrayType = TrayType.FAVORITES, favorites: string[], iconSize: number | Binding<any, any, number>, onMiddleClick: (item: TrayItem) => void) {
    const items = tray.items
        .filter(item => {
            switch(trayType) {
            case TrayType.ALL: return true;
            case TrayType.FAVORITES: return favorites.includes(getTrayItemID(item));
            case TrayType.NON_FAVORITES: return !favorites.includes(getTrayItemID(item));
            default: return false;
            }
        })
        .map(item => trayButton(item, iconSize, onMiddleClick));
    trayBox.children = items;
}