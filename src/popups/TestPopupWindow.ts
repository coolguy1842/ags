import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";

export function createTestPopupWindow() {
    return new PopupWindow(
        {
            name: "test-popup-window",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box({
            className: "test-popup-window",
            children: [
                Widget.Label("test")
            ]
        }),
        { animation: PopupAnimations.Ease, duration: 0.4, refreshRate: 165 }
    );
}