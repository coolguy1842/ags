import Gtk from "gi://Gtk?version=3.0";
import { Binding } from "resource:///com/github/Aylur/ags/service.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { DerivedVariable, splitToNChunks } from "src/utils/utils";
import Box from "types/widgets/box";

const applications = await Service.import("applications");

function AppLauncherItem(child: Gtk.Widget | Binding<any, any, Gtk.Widget>, onClicked: () => void) {
    return Widget.Button({
        className: "app-launcher-item",
        halign: Gtk.Align.CENTER,
        child: child,
        onClicked
    });
}


function updateApplications(widget: Box<Gtk.Widget, unknown>) {
    const { app_launcher } = globals.optionsHandler!.options;

    const input = globals.searchInput?.value ?? "";
    var children: Gtk.Widget[] = [];

    if(/^\s*-?(\d+|(\d?\.\d+))( ?([-\+\/\*]|(\*\*)){1} ?-?(\d+|(\d?\.\d+))){1,}$/.test(input)) {
        children.push(
            AppLauncherItem(
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
        )
    }
    else if(/^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(input)) {
        children.push(
            AppLauncherItem(
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
        .slice(0, app_launcher.rows.value * app_launcher.columns.value)
        .map(application => AppLauncherItem(
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

    widget.children = splitToNChunks(
        children.slice(0, app_launcher.rows.value * app_launcher.columns.value),
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
            }).hook(globals.searchInput!, (self) => self.text = globals.searchInput!.value as string),
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

    const itemsWidth = new DerivedVariable([app_launcher.icon_size, app_launcher.spacing, app_launcher.columns], (icon_size, spacing, cols) => {
        return (cols * icon_size) + (cols * (spacing));
    });

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
        if(globals.searchInput) {
            globals.searchInput.value = "";
        }
        
        startDerived.stop();
        endDerived.stop();
    };

    appLauncher.show(monitor, startDerived, endDerived);
}