import Gtk30 from "gi://Gtk?version=3.0";
import { Application } from "resource:///com/github/Aylur/ags/service/applications.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { PopupWindow } from "src/utils/PopupWindow";

const applications = await Service.import("applications");
const { app_launcher, icons } = globals.optionsHandler.options;

const AppLauncherSearch: Variable<string> = new Variable("");
function mapApplication(application: Application) {
    return Widget.Button({
        className: "app-launcher-item",
        width_request: app_launcher.icon_size.value,
        height_request: app_launcher.icon_size.value,
        child: Widget.Icon({
            icon: Utils.lookUpIcon(application.icon_name ?? undefined, app_launcher.icon_size.value)?.load_icon(),
            // TODO: cant bind as it looks glitchy
            // likely an issue with the popupwindow class
            size: app_launcher.icon_size.value,
            tooltip_text: application.bind("name")
        }),
        onClicked: (self) => {
            application.launch();
        }
    });
}
function splitToNChunks(array: any[], n: number) {
    let result: any[] = [];
    while(array.length > 0) {
        result.push(array.splice(0, n));
    }

    return result;
}

function updateAppLauncherEntries(box) {
    const applicationsList = applications.list
            .sort((a, b) => b.frequency - a.frequency)
            .filter(x => x.match(AppLauncherSearch.value))
            .slice(0, app_launcher.columns.value * app_launcher.rows.value)
            .map(app => mapApplication(app));

    box.children = [
        ...splitToNChunks(applicationsList, app_launcher.columns.value).map(x => Widget.Box({
            children: x
        }))
    ];

    console.log(box.children.length);
}

const launcherEntriesWidth = Utils.derive([app_launcher.icon_size, app_launcher.columns, app_launcher.icon_spacing], (icon_size, columns, icon_spacing) => {
    return (icon_size * columns) + (icon_spacing * (columns - 1));
});

const launcherEntriesHeight = Utils.derive([app_launcher.icon_size, app_launcher.rows, app_launcher.icon_spacing], (icon_size, rows, icon_spacing) => {
    return (icon_size * rows) + (icon_spacing * (rows - 1));
});

const AppLauncherEntries = Widget.Box({
    halign: Gtk30.Align.FILL,
    // valign: Gtk30.Align.CENTER,
    width_request: launcherEntriesWidth.bind(),
    height_request: launcherEntriesHeight.bind(),
    vertical: true,
    spacing: app_launcher.icon_spacing.bind(),
})
    .hook(AppLauncherSearch, (self) => updateAppLauncherEntries(self))
    .hook(applications, (self) => updateAppLauncherEntries(self))
    .hook(app_launcher.columns, (self) => updateAppLauncherEntries(self))
    .hook(app_launcher.rows, (self) => updateAppLauncherEntries(self))
    .hook(app_launcher.icon_size, (self) => updateAppLauncherEntries(self));

const AppLauncherWidget = Widget.Box({
    className: "app-launcher",
    vertical: true,
    spacing: app_launcher.spacing.bind(),
    children: [
        Widget.Entry({
            className: "app-launcher-input",
            primary_icon_name: icons.app_launcher.search.bind(),
            on_change: self => AppLauncherSearch.value = self.text ?? "",
            setup: self => self.hook(AppLauncherSearch, () => self.text = AppLauncherSearch.value as string),
        }),
        AppLauncherEntries,
        Widget.Box({
            child: app_launcher.show_frequents.bind().transform(show => {
                if(!show) return Widget.Box({});

                return Widget.Box({
                    vertical: true,
                    spacing: app_launcher.spacing.bind(),
                    children: [
                        Widget.Box({
                            className: "app-launcher-seperator",
                            hexpand: true,
                        }),
                        Widget.Box({
                            className: "app-launcher-favorites",
                            spacing: app_launcher.icon_spacing.bind(),
                            children: applications.bind("frequents")
                                .as(frequents => {
                                    const arr: { name: string; frequency: number; }[] = [];
                                    for(const key in frequents) {
                                        arr.push({
                                            name: key,
                                            frequency: frequents[key]
                                        })
                                    }

                                    return arr;
                                })
                                .as(frequents => frequents.sort((a, b) => b.frequency - a.frequency).slice(0, app_launcher.number_frequents.value))
                                .transform(frequents => frequents.map(application => {
                                    if(!application) return Widget.Box();
                                    const app = applications.list.find(x => x.desktop == application.name);

                                    if(!app) return Widget.Box();

                                    return mapApplication(app);
                                }))
                        })
                    ]
                });
            })
        })
    ],
});



const AppLauncherWindow = new PopupWindow({
    name: "app-launcher-window",
    exclusivity: "exclusive"
}, AppLauncherWidget, undefined, () => AppLauncherSearch.value = "", () => AppLauncherSearch.value = "");

export { AppLauncherWidget, AppLauncherWindow, AppLauncherSearch };