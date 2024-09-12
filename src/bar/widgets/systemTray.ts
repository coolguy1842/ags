import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { DerivedVariable, getTrayItemID } from "src/utils/utils";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { PopupAnimations, TPosition } from "src/utils/classes/PopupAnimation";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

import Gtk from "gi://Gtk?version=3.0";
import Gdk from "gi://Gdk";
import { BooleanValidator, HEXColorValidator, StringArrayValidator, ValueInEnumValidator } from "src/options";

const tray = await Service.import("systemtray");

//#region PROPS

const defaultProps = {
    background: "#BDA4A419",
    spacing: 3,
    enable_favorites: true,
    favorites: [] as string[]
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
    newProps.favorites = new StringArrayValidator().validate(newProps.favorites) ?? fallback.favorites;

    newProps.favorites = [
        // clean to make only unique ids
        ...new Set(newProps.favorites)
    ]

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

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-system-tray",
            child: Widget.Box({
                spacing: props.spacing,
                children: [
                    Widget.Box({
                        spacing: props.spacing,
                        children: tray.bind("items").transform(items => items.map(item => this.trayButton(item)))
                    }),
                    props.enable_favorites ? this.trayPopupFavoritesButton(monitor.id) : Widget.Box()
                ]
            })
        }); 
    }

    private trayButton(item: TrayItem) {
        return Widget.Button({
            classNames: [ "bar-system-tray-item", `bar-system-tray-item-id-${getTrayItemID(item)}` ],
            child: Widget.Icon({
                icon: item.icon
            }),
            onPrimaryClick: (self, event) => {
                item.activate(event);
            },
            onSecondaryClick: (self, event) => {
                item.menu?.popup_at_widget(self, Gdk.Gravity.CENTER, Gdk.Gravity.SOUTH_WEST, event);
            },
            onMiddleClick: (self, event) => {
                // pin to favourites
            }
        })
    }

    private trayPopupFavoritesButton(monitorID: number) {
        const button = Widget.Button({
            className: "bar-system-tray-popup-favorites-button",
            label: "󰄝 "
        });

        button.on_clicked = () => {
            const getPosition = () => {
                if(button.is_destroyed || !button.get_accessible()) {
                    return {
                        x: 0, y: 0
                    }
                };
    
                const parentAllocation = button.parent.parent.get_allocation();
                const allocation = button.get_allocation();

                const [ windowX, windowY ] = button.get_window()?.get_position() ?? [ 0, 0 ];

                return {
                    x: (parentAllocation.x + allocation.x) + (allocation.width / 2),
                    y: (parentAllocation.y + allocation.y + windowY) + allocation.height
                }
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
    
            const deriveFunction = (position: TPosition, childAllocation: Gdk.Rectangle, screenBounds: Gdk.Rectangle) => {
                const screenPadding = 10;
                const out = {
                    x: position.x - (childAllocation.width / 2),
                    y: position.y + childAllocation.height + screenPadding
                };

                if(out.x + childAllocation.width > screenBounds.width) {
                    // give a little padding from the screen border
                    out.x = (screenBounds.width - childAllocation.width) - screenPadding;
                }
                else if(out.x < 0) {
                    // give a little padding from the screen border
                    out.x = screenPadding;
                }

                if(out.y + childAllocation.height > screenBounds.height) {
                    // give a little padding from the screen border
                    out.y = (screenBounds.height - childAllocation.height) - screenPadding;
                }
                else if(out.y < 0) {
                    // give a little padding from the screen border
                    out.y = screenPadding;
                }

                return out;
            };

            const endDerived = new DerivedVariable(
                [
                    position,
                    this._trayFavoritesPopupWindow.childAllocation,
                    this._trayFavoritesPopupWindow.screenBounds
                ],
                deriveFunction
            );

            const startDerived = new DerivedVariable(
                [
                    position,
                    this._trayFavoritesPopupWindow.childAllocation,
                    this._trayFavoritesPopupWindow.screenBounds
                ],
                (position, childAllocation, screenBounds) => {
                    return {
                        x: deriveFunction(position, childAllocation, screenBounds).x,
                        y: 0
                    };
                }
            );
    
            this._trayFavoritesPopupWindow.animationOptions!.startPosition = startDerived;
            this._trayFavoritesPopupWindow.onHide = () => {
                position.stopPoll();

                startDerived.stop();
                endDerived.stop();
            };

            this._trayFavoritesPopupWindow.show(monitorID, endDerived);
        }

        return button;
    }


    private _trayFavoritesPopupWindow = new PopupWindow(
        {
            name: "test-popup-2",
            keymode: "on-demand"
        },
        Widget.Box({
            css: "background-color: black;",
            widthRequest: 150,
            height_request: 100,
            children: [
                Widget.Label({        
                    widthRequest: 150,
                    height_request: 100,
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