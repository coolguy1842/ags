import { globals } from "src/globals";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";

export function createAppLauncherPopupWindow() {
    return new PopupWindow(
        {
            name: "app-launcher-popup-window",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box({
            className: "app-launcher",
            vertical: true,
            children: [
                Widget.Entry({
                    className: "app-launcher-input"
                }),
                Widget.Label("App Launcher")
            ]
        }),
        { animation: PopupAnimations.Ease, animateTransition: true, duration: 0.4, refreshRate: 165 }
    );
}

export function toggleAppLauncherPopupWindow(monitor: number) {
    const appLauncherPopup = globals.popupWindows?.AppLauncherPopupWindow;
    if(!appLauncherPopup) return;
    if(appLauncherPopup.window.is_visible() && appLauncherPopup.window.monitor == monitor) {
        appLauncherPopup.hide();

        return;
    }

    const endDerived = new DerivedVariable(
        [
            appLauncherPopup.screenBounds,
            appLauncherPopup.childAllocation
        ],
        (screenBounds, childAllocation) => {
            return {
                x: (screenBounds.width / 2) - (childAllocation.width / 2),
                y: screenBounds.height - 15
            }
        }
    );

    const startDerived = new DerivedVariable(
        [
            endDerived,
            appLauncherPopup.screenBounds,
            appLauncherPopup.childAllocation
        ],
        (end, screenBounds, childAllocation) => {
            return {
                x: end.x,
                y: screenBounds.height + childAllocation.height
            }
        }
    );

    const onStop = () => {
        startDerived.stop();
        endDerived.stop();
    };

    appLauncherPopup.onceMulti({
        "hideComplete": onStop,
        "cleanup": onStop
    });

    appLauncherPopup.show(monitor, startDerived, endDerived);
}