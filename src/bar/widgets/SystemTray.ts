import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "types/service/systemtray";

import { Binding } from "types/service";
import { globals } from "src/globals";
import { getActiveFavorites, getTrayItemID } from "src/utils/utils";

import { toggleSystemTrayPopup } from "src/popups/SystemTrayPopupWindow";

import { HEXColorValidator } from "src/options/validators/hexColorValidator";
import { BooleanValidator } from "src/options/validators/booleanValidator";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { TrayType } from "../enums/trayType";

import Box from "types/widgets/box";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";


const systemTray = await Service.import("systemtray");
const defaultProps = {
    enable_favorites: true,
    
    spacing: 3,

    icon_size: 14,
    
    horizontal_padding: 6,
    vertical_padding: 2
};

type PropsType = typeof defaultProps;
export class SystemTray extends BarWidget<PropsType> {
    constructor() { super("SystemTray", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            enable_favorites: BooleanValidator.create().validate(props.enable_favorites) ?? fallback.enable_favorites,

            icon_size: NumberValidator.create({ min: 4, max: 60 }).validate(props.icon_size) ?? fallback.icon_size,
            spacing: NumberValidator.create({ min: 0, max: 20 }).validate(props.spacing) ?? fallback.spacing,
            
            horizontal_padding: NumberValidator.create({ min: 0 }).validate(props.horizontal_padding) ?? fallback.horizontal_padding,
            vertical_padding: NumberValidator.create({ min: 0 }).validate(props.vertical_padding) ?? fallback.vertical_padding
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const { system_tray, bar, icons } = globals.optionsHandler!.options;

        var shouldHaveToggle = true;
        const toggleButton = Widget.Button({
            classNames: [ "bar-widget-system-tray-popup-button", "bar-button" ],
            child: Widget.Icon({
                visible: shouldHaveToggle,
                setup: (self) => {
                    const updateIcon = () => {
                        self.icon = this.loadPixbuf(icons.bar.tray_popup.value);
                    }

                    updateIcon();
                    self.hook(bar.icon_color, updateIcon);
                    self.hook(icons.bar.tray_popup, updateIcon);
                }
            }),
            onClicked: (self) => {
                toggleSystemTrayPopup(monitor.id, self);
            }
        });

        var connectNum: undefined | number = undefined;
        const updateChildren = (self: Box<Gtk.Widget, unknown>) => {
            const activeFavs = getActiveFavorites(system_tray.favorites.value);
            shouldHaveToggle = props.enable_favorites && activeFavs.length != systemTray.items.length;
            var shouldHaveBox = systemTray.items.length - activeFavs.length != systemTray.items.length;
            
            toggleButton.visible = shouldHaveToggle;
            if(connectNum) {
                toggleButton.disconnect(connectNum);
                connectNum = undefined;
            }

            connectNum = toggleButton.connect("notify::visible", () => {
                toggleButton.visible = shouldHaveToggle;
            });

            self.children = [
                Widget.Box({
                    visible: shouldHaveBox,
                    spacing: props.spacing,
                    setup: (self) => {
                        self.connect("notify::visible", () => {
                            if(self.visible == shouldHaveBox) return;
                            self.visible = shouldHaveBox;
                        });

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
            css: `padding: ${props.vertical_padding}px ${props.horizontal_padding}px;`,
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
            },
            tooltipText: item.title
        }),
        onPrimaryClick: (_self, event) => {
            item.activate(event);
        },
        onSecondaryClick: (_self, event) => {
            item.menu?.popup_at_pointer(event);
        },
        onMiddleClick: (_self, event) => onMiddleClick(item, event)
    });
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