import { TrayType } from "src/bar/enums/trayType";
import { updateTrayItems } from "src/bar/widgets/SystemTray";
import { globals } from "src/globals";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";

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
                updateTrayItems(self, system_tray.icon_size.value, type);
                self.hook(systemTray, () => updateTrayItems(self, system_tray.icon_size.value, type));
                self.hook(system_tray.favorites, () => updateTrayItems(self, system_tray.icon_size.value, type));
            }
        }),
        { animation: PopupAnimations.Ease, animateTransition: true, duration: 0.4, refreshRate: 165 }
    );
}