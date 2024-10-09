import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "types/service/systemtray";

import { HEXtoCSSRGBA } from "src/utils/colorUtils";
import { Binding } from "types/service";
import { globals } from "src/globals";
import { getTrayItemID } from "src/utils/utils";

import Box from "types/widgets/box";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";

const systemTray = await Service.import("systemtray");
const defaultProps = {
    background: "#242424A0",
    enable_favorites: true,
    
    spacing: 3,
    border_radius: 8,

    icon_size: 14,
    
    horizontal_padding: 6,
    vertical_padding: 2
};

type PropsType = typeof defaultProps;
export class SystemTray extends BarWidget<PropsType> {
    constructor() { super("SystemTray", defaultProps); }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Box({
            className: "bar-widget-system-tray",
            spacing: props.spacing,
            css: `
                background-color: ${HEXtoCSSRGBA(props.background)};
                border-radius: ${props.border_radius}px;

                padding: ${props.vertical_padding}px ${props.horizontal_padding}px;
            `,
            children: [
                Widget.Box({
                    spacing: props.spacing,
                    setup: (self) => {
                        var type = TrayType.ALL;
                        if(props.enable_favorites) {
                            type = TrayType.NON_FAVORITES;
                        }

                        updateTrayItems(self, props, type);
                        self.hook(systemTray, () => updateTrayItems(self, props, type));


                        const system_tray = globals.optionsHandler?.options.system_tray;
                        if(system_tray != undefined) {
                            self.hook(system_tray.favorites, () => updateTrayItems(self, props, type));   
                        }
                    }
                })
            ]
        });
    }
};

export function createTrayItem(item: TrayItem, iconSize: number | Binding<any, any, number>, onMiddleClick: (item: TrayItem, event: Gdk.Event) => void) {
    return Widget.Button({
        className: "bar-widget-system-tray-item",
        child: Widget.Icon({
            size: iconSize,
            icon: item.icon,
            setup: (self) => {
                self.hook(item, () => {
                    self.icon = item.icon;
                })
            }
        }),
        onPrimaryClick: (_self, event) => {
            item.activate(event);
        },
        onSecondaryClick: (_self, event) => {
            item.menu?.popup_at_pointer(event);
        },
        onMiddleClick: (_self, event) => onMiddleClick(item, event)
    })
}

export enum TrayType {
    ALL,
    NON_FAVORITES,
    FAVORITES
};

export function updateTrayItems(box: Box<Gtk.Widget, unknown>, props: PropsType, trayType: TrayType) {
    const system_tray = globals.optionsHandler?.options.system_tray;
    if(system_tray == undefined) {
        box.children = [];
        return;
    }

    var items = systemTray.items;
    var onMiddleClick;

    switch(trayType) {
    case TrayType.FAVORITES:
        items = items.filter(item => system_tray.favorites.value.includes(getTrayItemID(item)));
        onMiddleClick = (item, _event) => {
            system_tray.favorites.value = system_tray.favorites.value.filter(x => x != getTrayItemID(item));
        };

        break;
    case TrayType.NON_FAVORITES:
        items = items.filter(item => !system_tray.favorites.value.includes(getTrayItemID(item)));
        onMiddleClick = (item, _event) => {
            system_tray.favorites.value = [
                ...system_tray.favorites.value,
                getTrayItemID(item)
            ]
        };

        break;
    default: onMiddleClick = (_item, _event) => {}; break;
    }

    box.children = items.map(item => createTrayItem(item, props.icon_size, onMiddleClick));
}