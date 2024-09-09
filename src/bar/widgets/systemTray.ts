import { Box } from "resource:///com/github/Aylur/ags/widgets/box.js";
import { globals } from "src/globals";
import { SystemTrayWindow } from "src/systemTray/systemTray";
import { getTrayItemID } from "src/utils/utils";

const hyprland = await Service.import("hyprland");
const systemTray = await Service.import("systemtray");


export function getSystemTray() {
    const defaultProps = {};

    return {
        name: "SystemTray",
        props: defaultProps,
        create(monitorName: string, props: typeof defaultProps) {
            const updateTray = (trayBox: Box<never, unknown>) => {
                const favorites = globals.optionsHandler.options.system_tray.favorites;
        
                const favoriteItems = systemTray.items
                    .filter(x => favorites.value.includes(getTrayItemID(x)))
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
                                favorites.value = favorites.value.filter(x => x != id);
                            }
                        });
                    });
        
                if(favoriteItems.length != systemTray.items.length) {
                    favoriteItems.push(
                        Widget.Button({
                            className: "bar-system-tray-button",
                            label: "󰄝 ",
                            onPrimaryClick: (btn, event) => {
                                const allocation = btn.get_allocation();
                                const monitor = hyprland.monitors.find(x => x.name == monitorName)!;

                                const position = {
                                    x: allocation.x,
                                    y: monitor.height - ((allocation.height + allocation.y) + 10),
                                };
        
                                if(SystemTrayWindow.window.is_visible()) {
                                    SystemTrayWindow.hide();
                                }
                                else {
                                    SystemTrayWindow.show(monitor.id, position);
                                }
                            }
                        })
                    );
                }
        
                trayBox.children = favoriteItems as never[];
            }

            return Widget.Box({
                class_name: "bar-system-tray",
                spacing: globals.optionsHandler.options.bar.system_tray.spacing.bind(),
                children: [],
                setup: (box) => updateTray(box)
            }).hook(globals.optionsHandler.options.system_tray.favorites, (box) => {
                updateTray(box);
            }).hook(systemTray, (box) => {
                updateTray(box);
            })
        }
    };
}