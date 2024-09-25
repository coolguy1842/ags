import Gtk from "gi://Gtk?version=3.0";
import { Binding } from "resource:///com/github/Aylur/ags/service.js";
import { Application } from "resource:///com/github/Aylur/ags/service/applications.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { splitToNChunks } from "src/utils/utils";
import Box from "types/widgets/box";

const applications = await Service.import("applications");

function AppLauncherItem(application: Application, icon_size: number | Binding<any, any, number>) {
    return Widget.Button({
        className: "app-launcher-item",
        child: Widget.Icon({
            size: icon_size,
            icon: Utils.lookUpIcon(application.icon_name ?? undefined, 32)?.load_icon()
        }),
        onClicked: () => {
            application.launch();

            globals.popupWindows?.AppLauncher?.hide();
            if(globals.searchInput) {
                globals.searchInput.value = "";
            }
        }
    });
}


function updateApplications(widget: Box<Gtk.Widget, unknown>) {
    const { app_launcher } = globals.optionsHandler!.options;

    const children = splitToNChunks(
        applications.list
            .filter(app => app.match(globals.searchInput!.value))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, app_launcher.rows.value * app_launcher.columns.value)
            .map(application => AppLauncherItem(application, app_launcher.icon_size.value)),

        app_launcher.columns.value
    ).map(x => Widget.Box({
        spacing: app_launcher.spacing.value,
        children: x
    }));

    widget.children = children;
}

function createAppLauncherPopupWidget() {
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
    const popupWindow = new PopupWindow(
        {
            name: "app-launcher-popup",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        createAppLauncherPopupWidget(),
        {
            animation: PopupAnimations.Ease,
            duration: 0.4,
            refreshRate: 165
        }
    );

    return popupWindow;
}