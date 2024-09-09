import { globals } from "src/globals";
import { PopupWindow } from "src/utils/PopupWindow";
import { getActiveFavorites, getTrayItemID } from "src/utils/utils";

const systemTray = await Service.import("systemtray");


function updateTray(trayBox) {
    const favorites = globals.optionsHandler.options.system_tray.favorites;
        
    const favoriteItems = systemTray.items
        .filter(x => !favorites.value.includes(getTrayItemID(x)))
        .map(item => {
            const id = getTrayItemID(item);

            return Widget.Button({
                class_name: `bar-system-tray-icon bar-system-tray-item-${id} ${item.title.includes("spotify") ? "tray-icon-spotify" : ""}`,
                child: Widget.Icon({
                    icon: item.icon
                }),
                onPrimaryClick: (_, event) => {
                    item.activate(event);
                },
                onSecondaryClick: (_, event) => {
                    item.openMenu(event);
                },
                onMiddleClick: (_, _event) => {
                    favorites.value = [
                        ...favorites.value,
                        id
                    ];

                    if(getActiveFavorites(favorites.value).length == systemTray.items.length) {
                        SystemTrayWindow.hide();
                    }
                },
            });
        });

    trayBox.children = favoriteItems as never[];
}

const SystemTrayWidget = Widget.Box({
    className: "system-tray",
    spacing: globals.optionsHandler.options.system_tray.spacing.bind(),
    children: [],
    setup: (self) => {
        updateTray(self);
    }
}).hook(globals.optionsHandler.options.system_tray.favorites, (self) => {
    updateTray(self);
}).hook(systemTray, (self) => {
    updateTray(self);
}) 


const SystemTrayWindow = new PopupWindow({
    name: "system-tray-window",
    exclusivity: "exclusive",
}, SystemTrayWidget);

export { SystemTrayWidget, SystemTrayWindow };