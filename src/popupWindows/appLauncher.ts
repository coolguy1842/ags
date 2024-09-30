import Gtk from "gi://Gtk?version=3.0";
import Pango10 from "gi://Pango";
import { Binding } from "resource:///com/github/Aylur/ags/service.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { DerivedVariable, sleep, splitToNChunks } from "src/utils/utils";
import Box from "types/widgets/box";

const applications = await Service.import("applications");

var items: Gtk.Button[];

var itemDisplayText: Variable<string> = new Variable("");
var itemCursor: Variable<number> = new Variable(0);
var itemScroll = 0;

function AppLauncherItem(index: number, displayText: string, child: Gtk.Widget | Binding<any, any, Gtk.Widget>, onClicked: () => void) {
    return Widget.Button({
        className: "app-launcher-item",
        name: displayText,
        halign: Gtk.Align.CENTER,
        child: child,
        onClicked,
        setup: (self) => {
            self.hook(itemCursor, () => {
                self.toggleClassName("app-launcher-item-selected", itemCursor.value == index);
            });

            self.on("enter-notify-event", () => {
                itemCursor.value = index;
                itemDisplayText.value = displayText;
            });
        }
    });
}


function getCurrentItem(): Gtk.Button | undefined {
    return items[itemCursor.value];
}

function updateCursor(columns: number, newValue: number) {
    itemCursor.value = Math.min(Math.max(newValue, 0), items.length - 1);

    const item = getCurrentItem();
    itemDisplayText.value = item?.name ?? "";
}


function updateApplications(widget: Box<Gtk.Widget, unknown>) {
    const { app_launcher } = globals.optionsHandler!.options;

    const input = globals.searchInput?.value ?? "";
    var children: Gtk.Button[] = [];

    itemCursor.value = 0;
    if(/^\s*-?(\d+|(\d?\.\d+))( ?([-\+\/\*]|(\*\*)){1} ?-?(\d+|(\d?\.\d+))){1,}$/.test(input)) {
        children.push(
            AppLauncherItem(0,
                "Copy to clipboard",
                Widget.Label({
                    hpack: "center",
                    label: `${eval(input)}`,
                    width_request: widget.width_request
                }),
                async () => {
                    console.log(Utils.execAsync(`wl-copy ${eval(input)}`));
                    globals.popupWindows?.AppLauncher?.hide();
                }
            )
        );
    }
    else if(/^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(input)) {
        children.push(
            AppLauncherItem(0,
                "Open in browser",
                Widget.Label({
                    hpack: "center",
                    label: `${input}`,
                    width_request: widget.width_request
                }),
                async () => {
                    console.log(Utils.execAsync(`xdg-open "https://${input}"`));
                    globals.popupWindows?.AppLauncher?.hide();
                }
            )
        )
    }
    else {
        children = applications.list
        .filter(app => app.match(input))
        .sort((a, b) => b.frequency - a.frequency)
        .map((application, index) => AppLauncherItem(index,
            `Launch ${application.app.get_name()}`,
            Widget.Icon({
                size: app_launcher.icon_size.value,
                icon: Utils.lookUpIcon(application.icon_name ?? undefined, 32)?.load_icon()
            }),
            async () => {
                application.launch();
                globals.popupWindows?.AppLauncher?.hide();
            }
        ));
    }

    items = children;
    updateCursor(app_launcher.columns.value, itemCursor.value);

    const scrollAmount = itemScroll * app_launcher.columns.value;
    widget.children = splitToNChunks(
        children.slice(scrollAmount, (app_launcher.rows.value * app_launcher.columns.value) + scrollAmount),
        app_launcher.columns.value
    ).map(x => Widget.Box({
        spacing: app_launcher.spacing.value,
        children: x
    }));
}

function createAppLauncherPopupWidget(width: Variable<number>) {
    const { app_launcher } = globals.optionsHandler!.options;

    const widget = Widget.Box({
        className: "app-launcher",
        vertical: true,
        spacing: app_launcher.spacing.bind(),
        children: [
            Widget.Entry({
                className: "app-launcher-search-input",
                onChange: (self) => globals.searchInput!.value = self.text ?? ""
            })
                .keybind("Return", (self) => {
                    const item = getCurrentItem();
                    item?.clicked();
                })
                .keybind("Left", (self) => {
                    if(self.cursor_position != 0) {
                        return;
                    }

                    updateCursor(app_launcher.columns.value, itemCursor.value - 1);
                })
                .keybind("Right", (self) => {
                    if(self.cursor_position != self.text_length) {
                        return;
                    }

                    updateCursor(app_launcher.columns.value, itemCursor.value + 1);
                })
                .keybind("Up", (self) => {
                    updateCursor(app_launcher.columns.value, itemCursor.value - app_launcher.columns.value);
                })
                .keybind("Down", async (self) => {
                    updateCursor(app_launcher.columns.value, itemCursor.value + app_launcher.columns.value);

                    // have to have this, if not then down arrow removes focus from the input
                    await sleep(1);
                    self.grab_focus();
                })
                .hook(globals.searchInput!, (self) => self.text = globals.searchInput!.value as string),
            Widget.Label({
                label: itemDisplayText.bind(),
                ellipsize: Pango10.EllipsizeMode.END
            }),
            Widget.Box({
                className: "app-launcher-app-container",
                vertical: true,
                hpack: "center",
                widthRequest: width.bind(),
                spacing: app_launcher.spacing.bind(),
                setup: updateApplications
            })
                .hook(globals.searchInput!, updateApplications)
                .hook(app_launcher.icon_size, updateApplications)
                .hook(app_launcher.spacing, updateApplications)
                .hook(app_launcher.columns, updateApplications)
                .hook(app_launcher.rows, updateApplications)
        ]
    });

    return widget;
}

export function createAppLauncherPopupWindow() {
    const { app_launcher } = globals.optionsHandler!.options;

    const itemsWidth = new DerivedVariable(
        [app_launcher.icon_size, app_launcher.spacing, app_launcher.columns, app_launcher.application.padding],
        (icon_size, spacing, cols, padding) => {
            return (cols * (icon_size + (padding * 2))) + (cols * (spacing));
        }
    );

    const popupWindow = new PopupWindow(
        {
            name: "app-launcher-popup",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        createAppLauncherPopupWidget(itemsWidth),
        {
            animation: PopupAnimations.Ease,
            duration: 0.4,
            refreshRate: 165
        },
        {
            onCleanup: (self) => {
                itemsWidth.stop();
            }
        }
    );

    return popupWindow;
}

export function toggleAppLauncher(appLauncher: PopupWindow<any, any>, monitor: number) {
    if(appLauncher.window.is_visible() && appLauncher.window.monitor == monitor) {
        appLauncher.hide();

        return;
    }

    const endDerived = new DerivedVariable(
        [
            appLauncher.screenBounds,
            appLauncher.childAllocation
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
            appLauncher.screenBounds,
            appLauncher.childAllocation
        ],
        (end, screenBounds, childAllocation) => {
            return {
                x: end.x,
                y: screenBounds.height + childAllocation.height
            }
        }
    );

    appLauncher.onHide = () => {
        const { app_launcher } = globals.optionsHandler!.options!;

        if(globals.searchInput) {
            globals.searchInput.value = "";
        }

        itemScroll = 0;
        updateCursor(app_launcher.columns.value, 0);

        startDerived.stop();
        endDerived.stop();
    };

    appLauncher.show(monitor, startDerived, endDerived);
}