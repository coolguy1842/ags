import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "types/service/systemtray";

import { HEXtoCSSRGBA } from "src/utils/colorUtils";
import { Binding } from "types/service";
import { globals } from "src/globals";
import { getActiveFavorites, getTrayItemID } from "src/utils/utils";

import { HEXColorValidator } from "src/options/validators/hexColorValidator";
import { BooleanValidator } from "src/options/validators/booleanValidator";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { BarPosition } from "src/options/options";
import { TrayType } from "../enums/trayType";

import Box from "types/widgets/box";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";
import { toggleSystemTrayPopup } from "src/popups/SystemTrayPopupWindow";


const systemTray = await Service.import("systemtray");
const defaultProps = {
    background: "#242424A0",
    popup_icon: "󰄝  ",
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
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            popup_icon: StringValidator.create().validate(props.popup_icon) ?? fallback.popup_icon,
            background: HEXColorValidator.create().validate(props.background) ?? fallback.background,
            
            enable_favorites: BooleanValidator.create().validate(props.enable_favorites) ?? fallback.enable_favorites,

            icon_size: NumberValidator.create({ min: 4, max: 60 }).validate(props.icon_size) ?? fallback.icon_size,
            border_radius: NumberValidator.create({ min: 0, max: 24 }).validate(props.border_radius) ?? fallback.border_radius,
            spacing: NumberValidator.create({ min: 0, max: 20 }).validate(props.spacing) ?? fallback.spacing,
            
            horizontal_padding: NumberValidator.create({ min: 0, max: 32 }).validate(props.horizontal_padding) ?? fallback.horizontal_padding,
            vertical_padding: NumberValidator.create({ min: 0, max: 12 }).validate(props.vertical_padding) ?? fallback.vertical_padding
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const system_tray = globals.optionsHandler?.options.system_tray;

        const toggleButton = Widget.Button({
            classNames: [ "bar-widget-system-tray-popup-button", "bar-button" ],
            label: props.popup_icon,
            onClicked: (self) => {
                toggleSystemTrayPopup(monitor.id, self);
            }
        });

        const updateChildren = (self: Box<Gtk.Widget, unknown>) => {
            var shouldHaveToggle = props.enable_favorites && getActiveFavorites(system_tray?.favorites.value ?? []).length != systemTray.items.length;
            // hack to hide it
            toggleButton.label = shouldHaveToggle ? props.popup_icon : "";

            self.children = [
                Widget.Box({
                    spacing: props.spacing,
                    setup: (self) => {
                        var type = TrayType.ALL;
                        if(props.enable_favorites) {
                            type = TrayType.FAVORITES;
                        }
    
                        updateTrayItems(self, props.icon_size, type);
                        self.hook(systemTray, () => updateTrayItems(self, props.icon_size, type));
    
                        if(system_tray != undefined) {
                            self.hook(system_tray.favorites, () => updateTrayItems(self, props.icon_size, type));
                        }
                    }
                }),
                toggleButton
            ];    
        }

        return Widget.Box({
            className: "bar-widget-system-tray",
            spacing: props.spacing + 2,
            css: `
                background-color: ${HEXtoCSSRGBA(props.background)};

                padding: ${props.vertical_padding}px ${props.horizontal_padding}px;
                border-radius: ${props.border_radius}px;
            `,
            setup: (self) => updateChildren(self)
        }).hook(systemTray, (self) => updateChildren(self))
            .hook(system_tray!.favorites, (self) => updateChildren(self));
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

export function updateTrayItems(box: Box<Gtk.Widget, unknown>, iconSize: number, trayType: TrayType) {
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

    box.children = items.map(item => createTrayItem(item, iconSize, onMiddleClick));
}