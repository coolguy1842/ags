import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { PopupWindow } from "src/utils/PopupWindow";

const applications = await Service.import("applications");

const AppLauncherSearch: Variable<string> = new Variable("");
function updateAppLauncherEntries(box) {
    const applicationsList = applications.list
            .sort((a, b) => b.frequency - a.frequency)
            .filter(x => x.name.toLowerCase().startsWith(AppLauncherSearch.value))
            .slice(0, 15)
            .map(app => 
                Widget.Button({
                    className: "app-launcher-item",
                    child: Widget.Icon({
                        icon: Utils.lookUpIcon(app.icon_name ?? undefined, 50)?.load_icon(),
                        size: 62,
                        tooltip_text: app.bind("name")
                    }),
                    onClicked: (self) => {
                        app.launch();
                    }
                })
            );

    box.children = [
        ...applicationsList
    ];
}

const AppLauncherEntries = Widget.Box({}).hook(AppLauncherSearch, (self) => {
    updateAppLauncherEntries(self);
}).hook(applications, (self) => {
    updateAppLauncherEntries(self);
});

const AppLauncherWidget = Widget.Box({
    className: "app-launcher",
    vertical: true,
    children: [
        Widget.Entry({
            hexpand: true,
            className: "app-launcher-input",
            primary_icon_name: globals.optionsHandler.options.icons.app_launcher.search.bind(),
            on_change: self => AppLauncherSearch.value = self.text ?? "",
            setup: self => self.hook(AppLauncherSearch, () => self.text = AppLauncherSearch.value as string),
        }),
        AppLauncherEntries
    ],
});



const AppLauncherWindow = new PopupWindow({
    name: "app-launcher-window",
    exclusivity: "exclusive"
}, AppLauncherWidget, undefined);

export { AppLauncherWidget, AppLauncherWindow, AppLauncherSearch };