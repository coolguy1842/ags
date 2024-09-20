import { globals } from "src/globals";
import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { DerivedVariable, getActiveFavorites, getTrayItemID } from "src/utils/utils";
import { TPosition } from "src/utils/classes/PopupAnimation";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";
import { BarPosition, BooleanValidator, HEXColorValidator, NumberValidator } from "src/options";
import Box from "types/widgets/box";
import { HEXtoCSSRGBA } from "src/utils/colorUtils";
import { updateTray } from "src/components/trayComponents";
import { TrayType } from "../enums/trayType";
import { TrayFavoritesPopupWindow } from "src/popupWindows/systemTray";

const tray = await Service.import("systemtray");

//#region PROPS

const defaultProps = {
    background: "#BDA4A419",
    enable_favorites: true,
    
    spacing: 3,
    border_radius: 8,

    icon_size: 50,
    
    horizontal_padding: 4,
    vertical_padding: 2,
};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps | undefined {
    if(props == undefined || typeof props != "object") {
        return fallback;
    }

    const newProps = Object.assign({}, props) as TProps;
    for(const key in props) {
        if(fallback[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in defaultProps) {
        if(newProps[key] == undefined) {
            newProps[key] = fallback[key];
        }
    }

    newProps.background = new HEXColorValidator().validate(newProps.background) ?? fallback.background;
    newProps.enable_favorites = new BooleanValidator().validate(newProps.enable_favorites) ?? fallback.enable_favorites;

    newProps.spacing = new NumberValidator({ min: 1, max: 20 }).validate(newProps.spacing) ?? fallback.spacing;
    newProps.border_radius = new NumberValidator({ min: 0, max: 24 }).validate(newProps.border_radius) ?? fallback.border_radius;

    newProps.horizontal_padding = new NumberValidator({ min: 0, max: 32 }).validate(newProps.horizontal_padding) ?? fallback.horizontal_padding;
    newProps.vertical_padding = new NumberValidator({ min: 0, max: 12 }).validate(newProps.vertical_padding) ?? fallback.vertical_padding;

    newProps.icon_size = new NumberValidator({ min: 0, max: 60 }).validate(newProps.icon_size) ?? fallback.icon_size;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class SystemTray implements IBarWidget<PropsType, Gtk.Box> {
    name = "SystemTray";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const { system_tray } = globals.optionsHandler.options;
        const trayType = props.enable_favorites ? TrayType.FAVORITES : TrayType.ALL;

        const onMiddleClick = (item: TrayItem) => {
            system_tray.favorites.value = system_tray.favorites.value.filter(x => x != getTrayItemID(item));
        }

        const updateTrayFn = (self: Box<Gtk.Widget, unknown>) => {
            updateTray(self, trayType, system_tray.favorites.value, props.icon_size, onMiddleClick);
        }

        const popupButton = this.trayPopupFavoritesButton(monitor.id, props);
        const updatePopupFn = (self: Box<Gtk.Widget, unknown>) => {
            if(!props.enable_favorites) {
                popupButton.set_visible(false);
                return;
            }

            if(getActiveFavorites(system_tray.favorites.value).length == tray.items.length) {
                popupButton.set_visible(false);
                return;
            }

            popupButton.set_visible(true);
        }

        return Widget.Box({
            class_name: "bar-system-tray",
            css: `
                background-color: ${HEXtoCSSRGBA(props.background)};
                padding: ${props.vertical_padding}px ${props.horizontal_padding}px;
                border-radius: ${props.border_radius}px;
            `,
            spacing: props.spacing,
            hpack: "center",
            children: [
                Widget.Box({
                    spacing: props.spacing,
                    setup: updateTrayFn
                })
                    .hook(tray, updateTrayFn)
                    .hook(system_tray.favorites, updateTrayFn),
                popupButton
            ],
            setup: updatePopupFn
        }).hook(tray, updatePopupFn).hook(system_tray.favorites, updatePopupFn);
    }

    private trayPopupFavoritesButton(monitorID: number, props: PropsType) {
        const button = Widget.Button({
            className: "bar-system-tray-popup-favorites-button",
            label: "󰄝 "
        });

        button.on_clicked = () => {
            const barPosition = globals.optionsHandler.options.bar.position;
            const barHeight = globals.optionsHandler.options.bar.height;

            const getPosition = () => {
                if(button.is_destroyed || !button.get_accessible()) {
                    return {
                        x: 0, y: 0
                    }
                };
    
                const allocation = button.get_allocation();
                const position = {
                    x: allocation.x + (allocation.width / 2),
                    y: allocation.y + allocation.height
                };

                return position;
            }
    
            const position = new Variable(getPosition(), {
                poll: [
                    250,
                    (variable) => {
                        if(button.is_destroyed || !button.get_accessible()) {
                            variable.stopPoll();
                        }
    
                        return getPosition();
                    }
                ]
            });
    
            const deriveFunction = (barPos: BarPosition, barHeight: number, position: TPosition, childAllocation: Gdk.Rectangle, screenBounds: Gdk.Rectangle) => {
                const screenPadding = 10;
                var out = {
                    x: screenPadding,
                    y: screenPadding
                };

                switch(barPos) {
                case BarPosition.TOP: {
                    out = {
                        x: position.x - (childAllocation.width / 2),
                        y: screenBounds.height - (barHeight + screenPadding)
                    };
    
                    break;
                }
                // case isnt needed here, just have it to specify what its for
                case BarPosition.BOTTOM: default: {
                    out = {
                        x: position.x - (childAllocation.width / 2),
                        y: position.y + childAllocation.height + screenPadding
                    };

                    break;
                }
                }
                
                out.x = Math.min(out.x, (screenBounds.width - childAllocation.width) - screenPadding);
                out.x = Math.max(out.x, screenPadding);

                out.y = Math.min(out.y, screenBounds.height - screenPadding);
                out.y = Math.max(out.y, screenPadding);

                return out;
            };

            const endDerived = new DerivedVariable(
                [
                    barPosition,
                    barHeight,
                    position,
                    TrayFavoritesPopupWindow.childAllocation,
                    TrayFavoritesPopupWindow.screenBounds
                ],
                deriveFunction
            );

            const startDerived = new DerivedVariable(
                [
                    endDerived,
                    barPosition,
                    barHeight,
                    TrayFavoritesPopupWindow.childAllocation,
                    TrayFavoritesPopupWindow.screenBounds,
                ],
                (derived, barPos, barHeight, childAllocation, screenBounds) => {
                    return {
                        x: derived.x,
                        y: barPos == BarPosition.TOP ? screenBounds.height + childAllocation.height : barHeight
                    };
                }
            );
    
            TrayFavoritesPopupWindow.onHide = () => {
                position.stopPoll();

                startDerived.stop();
                endDerived.stop();
            };

            TrayFavoritesPopupWindow.child.spacing = props.spacing;
            TrayFavoritesPopupWindow.show(monitorID, startDerived, endDerived);
        }

        return button;
    }
};