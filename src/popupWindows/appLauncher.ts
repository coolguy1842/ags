import Gtk from "gi://Gtk?version=3.0";
import { Binding } from "resource:///com/github/Aylur/ags/service.js";
import { Application } from "resource:///com/github/Aylur/ags/service/applications.js";
import { globals } from "src/globals";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { splitToNChunks } from "src/utils/utils";
import Box from "types/widgets/box";

const applications = await Service.import("applications");

function AppLauncherItem(application: Application, icon_size: number | Binding<any, any, number>) {
    return Widget.Box({
        className: "app-launcher-item",
        children: [
            Widget.Icon({
                size: icon_size,
                icon: Utils.lookUpIcon(application.icon_name ?? undefined, 32)?.load_icon()
            })
        ]
    });
}


function updateApplications(widget: Box<Gtk.Widget, unknown>) {
    const { app_launcher } = globals.optionsHandler!.options;

    widget.children = splitToNChunks(
        applications.list
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, app_launcher.rows.value * app_launcher.columns.value)
            .map(application => AppLauncherItem(application, app_launcher.icon_size.bind())),

        app_launcher.columns.value
    ).map(x => Widget.Box({
        children: x
    }))
}

function createAppLauncherPopupWidget() {
    const { app_launcher } = globals.optionsHandler!.options;

    const widget = Widget.Box({
        className: "app-launcher",
        vertical: true,
        setup: updateApplications
    })
        .hook(app_launcher.columns, updateApplications)
        .hook(app_launcher.rows, updateApplications);

    return widget;
}

export function createAppLauncherPopupWindow() {
    const popupWindow = new PopupWindow(
        {
            name: "app-launcher-popup",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box(),
        {
            animation: PopupAnimations.Ease,
            duration: 0.4,
            refreshRate: 165
        },
        undefined,
        undefined,
        (self) => {
            self.child = createAppLauncherPopupWidget();
        }
    );

    return popupWindow;
}