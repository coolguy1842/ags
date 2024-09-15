import { globals } from "src/globals";
import { TrayType } from "src/bar/enums/trayType";
import { updateTray } from "src/components/trayComponents";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { Binding } from "types/service";
import { Option } from "src/utils/handlers/optionsHandler";

const tray = await Service.import("systemtray");

function createTrayFavoritesPopupWidget(favorites: Option<string[]>, icon_size: number | Binding<any, any, number>) {
    const updateFn = (self) => {
        updateTray(self, TrayType.NON_FAVORITES, favorites.value, icon_size, () => {});
    }

    return Widget.Box({
        className: "system-tray",
        setup: updateFn
    })
        .hook(tray, updateFn)
        .hook(favorites, updateFn);
}

function createTrayFavoritesPopupWindow() {
    const popupWindow = new PopupWindow(
        {
            name: "system-tray-popup",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box(),
        {
            animation: PopupAnimations.Ease,
            duration: 0.4,
            refreshRate: 165,
            startPosition: {
                x: 0,
                y: 0
            }
        },
        undefined,
        undefined,
        (self) => {
            const { system_tray } = globals.optionsHandler.options;

            self.child = createTrayFavoritesPopupWidget(system_tray.favorites, system_tray.icon_size.bind());
        }
    );

    return popupWindow;
}

export const TrayFavoritesPopupWindow = createTrayFavoritesPopupWindow();