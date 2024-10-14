import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { BarPosition } from "src/options/options";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import Box from "types/widgets/box";

import Button from "types/widgets/button";
import EventBox from "types/widgets/eventbox";
import Label from "types/widgets/label";

export function createQuickMenuPopupWindow() {
    return new PopupWindow(
        {
            name: "quick-menu-popup-window",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box({
            vertical: true,
            css: "background-color: black;",
            children: [
                Widget.Label("test"),
                Widget.Label("test2")
            ]
        }),
        { animation: PopupAnimations.Ease, animateTransition: true, duration: 0.4, refreshRate: 165 }
    );
}

export function toggleQuickMenuPopup(monitor: number, widget: Button<any, any>) {
    const quickMenuPopup = globals.popupWindows?.QuickMenuPopupWindow;
    const barPosition = globals.optionsHandler?.options.bar.position;
    if(!quickMenuPopup || !barPosition) return;
    if(quickMenuPopup.window.is_visible() && quickMenuPopup.window.monitor == monitor) {
        quickMenuPopup.hide();

        return;
    }

    for(const popup of Object.values(globals.popupWindows ?? {})) {
        if(popup == quickMenuPopup) continue;

        popup.hide();
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
            quickMenuPopup.screenBounds,
            quickMenuPopup.childAllocation
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
            quickMenuPopup.screenBounds,
            quickMenuPopup.childAllocation
        ],
        // i have no clue why i need child allocation, when its not there the start position is offset, may be that deriving it here updates it?
        (end, barHeight, barPosition, screenBounds, _childAllocation) => {
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

    widget.toggleClassName("bar-widget-quick-menu-active", true);

    const onStop = () => {
        widget.toggleClassName("bar-widget-quick-menu-active", false);

        position.stopPoll();
        barHeight.stopPoll();

        startDerived.stop();
        endDerived.stop();

        position.dispose();
        barHeight.dispose();
    };

    quickMenuPopup.onceMulti({
        "hideComplete": onStop,
        "cleanup": onStop
    });

    quickMenuPopup.show(monitor, startDerived, endDerived);
}