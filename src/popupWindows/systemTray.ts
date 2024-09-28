import { globals } from "src/globals";
import { TrayType } from "src/bar/enums/trayType";
import { updateTray } from "src/components/trayComponents";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { Binding } from "types/service";
import { Option } from "src/utils/handlers/optionsHandler";
import { TrayItem } from "resource:///com/github/Aylur/ags/service/systemtray.js";
import { getActiveFavorites, getTrayItemID } from "src/utils/utils";

const tray = await Service.import("systemtray");

function createTrayFavoritesPopupWidget(self: PopupWindow<any, any>, favorites: Option<string[]>, icon_size: number | Binding<any, any, number>) {
    const onMiddleClick = (item: TrayItem) => {
        favorites.value = [
            ...new Set([
                ...favorites.value,
                getTrayItemID(item)
            ])
        ]
    }

    const updateFn = (self) => {
        updateTray(self, TrayType.NON_FAVORITES, favorites.value, icon_size, onMiddleClick);
    }


    const tryHide = () => {
        if(getActiveFavorites(favorites.value).length == tray.items.length) {
            self.hide();
        }
    }

    const widget = Widget.Box({
        className: "system-tray",
        setup: updateFn
    })
        .hook(tray, (self) => { updateFn(self); tryHide(); })
        .hook(favorites, (self) => { updateFn(self); tryHide(); });

    return widget;
}

export function createTrayFavoritesPopupWindow() {
    const { system_tray } = globals.optionsHandler!.options;

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
            refreshRate: 165
        },
        {
            onLoad: (self) => {
                self.child = createTrayFavoritesPopupWidget(self, system_tray.favorites, system_tray.icon_size.bind());
            },
        }
    );

    return popupWindow;
}