import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { TrayType } from "src/bar/enums/trayType";
import { updateTrayItems } from "src/bar/widgets/SystemTray";
import { globals } from "src/globals";
import { BarPosition } from "src/options/options";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import Button from "types/widgets/button";

const systemTray = await Service.import("systemtray");
export function createSystemTrayPopupWindow() {
    return new PopupWindow(
        {
            name: "system-tray-popup-window",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box({
            className: "system-tray",
            spacing: globals.optionsHandler?.options.system_tray.spacing.bind(),
            setup: (self) => {
                const system_tray = globals.optionsHandler?.options.system_tray;
                if(system_tray == undefined) return;

                const type = TrayType.NON_FAVORITES;

                const updateTray = (self) => {
                    updateTrayItems(self, system_tray.icon_size.value, type);

                    if(self.children.length <= 0) {
                        const window = globals.popupWindows?.SystemTrayPopupWindow;
                        if(!window) return;

                        const animateOptions = window.animationOptions;
                        window.animationOptions = undefined;

                        window.onceMulti({
                            "hideCancel": () => window.animationOptions = animateOptions,
                            "hideComplete": () => window.animationOptions = animateOptions
                        })

                        globals.popupWindows?.SystemTrayPopupWindow.hide();
                    }
                }

                updateTray(self);
                self.hook(systemTray, updateTray);
                self.hook(system_tray.favorites, updateTray);
            }
        }),
        { animation: PopupAnimations.Ease, animateTransition: true, duration: 0.4, refreshRate: 165 }
    );
}

export function toggleSystemTrayPopup(monitor: number, widget: Button<any, unknown>) {
    const trayPopup = globals.popupWindows?.SystemTrayPopupWindow;
    const barPosition = globals.optionsHandler?.options.bar.position;
    if(!trayPopup || !barPosition) return;
    if(trayPopup.window.is_visible() && trayPopup.window.monitor == monitor) {
        trayPopup.hide();

        return;
    }

    const getPosition = () => {
        if(widget.is_destroyed) {
            return { x: 0, y: 0 }
        }

        const allocation = widget.get_allocation();
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
                if(widget.is_destroyed) {
                    variable.stopPoll();
                }

                return getPosition();
            }
        ]
    });

    const getBarHeight = () => {
        return widget.get_window()?.get_height() ?? (globals.optionsHandler?.options.bar.height.value ?? 0);
    }

    const barHeight = new Variable(getBarHeight(), {
        poll: [
            250,
            (variable) => {
                if(widget.is_destroyed) {
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

    trayPopup.show(monitor, startDerived, endDerived);
}