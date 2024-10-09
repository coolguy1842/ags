import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "types/service/systemtray";

import { HEXtoCSSRGBA } from "src/utils/colorUtils";
import { Binding } from "types/service";
import { globals } from "src/globals";
import { getTrayItemID } from "src/utils/utils";

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
        props.popup_icon = StringValidator.create().validate(props.popup_icon) ?? fallback.popup_icon;

        props.background = HEXColorValidator.create().validate(props.background) ?? fallback.background;
        props.enable_favorites = BooleanValidator.create().validate(props.enable_favorites) ?? fallback.enable_favorites;

        props.spacing = NumberValidator.create({ min: 0, max: 20 }).validate(props.spacing) ?? fallback.spacing;
        props.border_radius = NumberValidator.create({ min: 0, max: 24 }).validate(props.border_radius) ?? fallback.border_radius;

        props.horizontal_padding = NumberValidator.create({ min: 0, max: 32 }).validate(props.horizontal_padding) ?? fallback.horizontal_padding;
        props.vertical_padding = NumberValidator.create({ min: 0, max: 12 }).validate(props.vertical_padding) ?? fallback.vertical_padding;

        props.icon_size = NumberValidator.create({ min: 4, max: 60 }).validate(props.icon_size) ?? fallback.icon_size;

        return props;
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const children: Gtk.Widget[] = [
            Widget.Box({
                spacing: props.spacing,
                setup: (self) => {
                    var type = TrayType.ALL;
                    if(props.enable_favorites) {
                        type = TrayType.FAVORITES;
                    }

                    updateTrayItems(self, props.icon_size, type);
                    self.hook(systemTray, () => updateTrayItems(self, props.icon_size, type));

                    const system_tray = globals.optionsHandler?.options.system_tray;
                    if(system_tray != undefined) {
                        self.hook(system_tray.favorites, () => updateTrayItems(self, props.icon_size, type));
                    }
                }
            })
        ];

        if(props.enable_favorites) {
            children.push(Widget.Button({
                classNames: [ "bar-widget-system-tray-popup-button", "bar-button" ],
                label: props.popup_icon,
                onClicked: (self) => {
                    const trayPopup = globals.popupWindows?.SystemTrayPopupWindow;
                    const barPosition = globals.optionsHandler?.options.bar.position;
                    if(!trayPopup || !barPosition) return;
                    if(trayPopup.window.is_visible() && trayPopup.window.monitor == monitor.id) {
                        trayPopup.hide();
                
                        return;
                    }

                    const getPosition = () => {
                        if(self.is_destroyed || !self.get_accessible()) {
                            return { x: 0, y: 0 }
                        }
            
                        const allocation = self.get_allocation();
                        const position = {
                            x: allocation.x + (allocation.width / 2),
                            y: allocation.y + allocation.height
                        };

                        return position;
                    }
            
                    const position = new Variable(getPosition(), {
                        poll: [
                            100,
                            (variable) => {
                                if(self.is_destroyed || !self.get_accessible()) {
                                    variable.stopPoll();
                                }
            
                                return getPosition();
                            }
                        ]
                    });

                    const getBarHeight = () => {
                        return self.get_window()?.get_height() ?? (globals.optionsHandler?.options.bar.height.value ?? 0);
                    }
            
                    const barHeight = new Variable(getBarHeight(), {
                        poll: [
                            250,
                            (variable) => {
                                if(self.is_destroyed || !self.get_accessible()) {
                                    variable.stopPoll();
                                }
            
                                return getBarHeight();
                            }
                        ]
                    });

                    const endDerived = new DerivedVariable(
                        [
                            position,
                            barHeight,
                            barPosition,
                            trayPopup.screenBounds,
                            trayPopup.childAllocation
                        ],
                        (position, barHeight, barPosition, screenBounds, childAllocation) => {
                            const offset = 10;

                            var yPosition = 0;
                            switch(barPosition) {
                            case BarPosition.TOP:
                                yPosition = screenBounds.height - (offset - 1);
                                break;
                            case BarPosition.BOTTOM:
                                yPosition = childAllocation.height + barHeight + offset;
                                break;
                            default: break;
                            }

                            return {
                                x: Math.max(Math.min(position.x - (childAllocation.width / 2), (screenBounds.width - childAllocation.width) - offset), offset),
                                y: yPosition
                            }
                        }
                    );
                
                    const startDerived = new DerivedVariable(
                        [
                            endDerived,
                            barHeight,
                            barPosition,
                            trayPopup.screenBounds,
                            trayPopup.childAllocation
                        ],
                        (end, barHeight, barPosition, screenBounds, childAllocation) => {
                            var yPosition = 0;
                            switch(barPosition) {
                            case BarPosition.TOP:
                                yPosition = screenBounds.height + barHeight;
                                break;
                            case BarPosition.BOTTOM:
                                yPosition = barHeight;
                                break;
                            default: break;
                            }

                            return {
                                x: end.x,
                                y: yPosition
                            }
                        }
                    );
                
                    const onStop = () => {
                        position.stopPoll();
                        barHeight.stopPoll();

                        startDerived.stop();
                        endDerived.stop();

                        position.dispose();
                        barHeight.dispose();
                    };
    
                    trayPopup.onceMulti({
                        "hideComplete": onStop,
                        "cleanup": onStop
                    });
    
                    trayPopup.show(monitor.id, startDerived, endDerived);
                }
            }));
        }

        return Widget.Box({
            className: "bar-widget-system-tray",
            spacing: props.spacing,
            css: `
                background-color: ${HEXtoCSSRGBA(props.background)};

                padding: ${props.vertical_padding}px ${props.horizontal_padding}px;
                border-radius: ${props.border_radius}px;
            `,
            children
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