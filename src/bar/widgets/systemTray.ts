import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { DerivedVariable, getTrayItemID } from "src/utils/utils";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { PopupAnimations, TPosition } from "src/utils/classes/PopupAnimation";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";
import { BarPosition, BooleanValidator, HEXColorValidator, StringArrayValidator, ValueInEnumValidator } from "src/options";
import { globals } from "src/globals";
import Box from "types/widgets/box";

const tray = await Service.import("systemtray");

//#region PROPS

const defaultProps = {
    background: "#BDA4A419",
    spacing: 3,
    enable_favorites: true
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
    if(typeof newProps.spacing != "number" || newProps.spacing <= 0 || newProps.spacing > 30) {
        newProps.spacing = fallback.spacing;
    }

    newProps.enable_favorites = new BooleanValidator().validate(newProps.enable_favorites) ?? fallback.enable_favorites;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class SystemTray implements IBarWidget<PropsType, Gtk.EventBox> {
    name = "SystemTray";
    defaultProps = defaultProps;


    private _updateTray(trayBox: Box<Gtk.Widget, unknown>) {
        const favorites = globals.optionsHandler.options.bar.tray_favorites;

        trayBox.children = tray.items
            // .filter(item => favorites.value.includes(getTrayItemID(item)))
            .map(item => this.trayButton(item))
    }

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const favorites = globals.optionsHandler.options.bar.tray_favorites;

        return Widget.EventBox({
            class_name: "bar-system-tray",
            child: Widget.Box({
                spacing: props.spacing,
                children: [
                    Widget.Box({
                        spacing: props.spacing,
                        setup: (self) => this._updateTray(self)
                    })
                        .hook(tray, self => this._updateTray(self))
                        .hook(favorites, self => this._updateTray(self)),
                        
                    props.enable_favorites ? this.trayPopupFavoritesButton(monitor.id) : Widget.Box()
                ]
            })
        }); 
    }

    private trayButton(item: TrayItem) {
        const favorites = globals.optionsHandler.options.bar.tray_favorites;

        return Widget.Button({
            classNames: [ "bar-system-tray-item", `bar-system-tray-item-id-${getTrayItemID(item)}` ],
            child: Widget.Icon({
                icon: item.bind("icon")
            }),
            onPrimaryClick: (self, event) => {
                item.activate(event);
            },
            onSecondaryClick: (self, event) => {
                item.menu?.popup_at_widget(self, Gdk.Gravity.CENTER, Gdk.Gravity.SOUTH_WEST, event);
            },
            onMiddleClick: (self, event) => {
                favorites.value = [
                    ...new Set([
                        ...favorites.value,
                        getTrayItemID(item)
                    ])
                ]
            }
        })
    }

    private trayPopupFavoritesButton(monitorID: number) {
        const button = Widget.Button({
            className: "bar-system-tray-popup-favorites-button",
            label: "󰄝 "
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
    
                const parentAllocation = button.parent.parent.get_allocation();
                const allocation = button.get_allocation();

                // const barPosition = globals.optionsHandler.options.bar.position.value;
                const position = {
                    x: (parentAllocation.x + allocation.x) + (allocation.width / 2),
                    y: (parentAllocation.y + allocation.y) + allocation.height
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
                    this._systemTrayPopupWindow.childAllocation,
                    this._systemTrayPopupWindow.screenBounds
                ],
                deriveFunction
            );

            const startDerived = new DerivedVariable(
                [
                    endDerived,
                    barPosition,
                    this._systemTrayPopupWindow.childAllocation,
                    this._systemTrayPopupWindow.screenBounds,
                ],
                (derived, barPos, childAllocation, screenBounds) => {
                    return {
                        x: derived.x,
                        y: barPos == BarPosition.TOP ? screenBounds.height + childAllocation.height : 0
                    };
                }
            );
    
            this._systemTrayPopupWindow.animationOptions!.startPosition = startDerived;
            this._systemTrayPopupWindow.onHide = () => {
                position.stopPoll();

                startDerived.stop();
                endDerived.stop();
            };

            this._systemTrayPopupWindow.show(monitorID, endDerived);
        }

        return button;
    }


    private _systemTrayPopupWindow = new PopupWindow(
        {
            name: "system-tray-popup",
            keymode: "on-demand"
        },
        Widget.Box({
            className: "system-tray",
            children: [
                Widget.Label({
                    label: "test"
                })
            ]
        }),
        {
            animation: PopupAnimations.Ease,
            duration: 0.4,
            refreshRate: 165,
            startPosition: {
                x: 0,
                y: 0
            }
        }
    );
};