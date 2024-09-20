import { globals } from "./globals";
import { Bar } from "./bar/bar";
import { IReloadable } from "./interfaces/reloadable";
import Gdk30 from "gi://Gdk";
import { TrayFavoritesPopupWindow } from "./popupWindows/systemTray";

const hyprland = await Service.import("hyprland");

export class Main implements IReloadable {
    private _monitorLookups: { [name: string]: number } = {};

    loadMonitorLookups() {
        // not fully tested, allows for monitors to be added and removed and shows on the right monitor properly
        const screen = Gdk30.Screen.get_default();
        if(screen == undefined) {
            this._monitorLookups = {};
            return;
        }

        const monitors = screen.get_n_monitors();

        const monitorLookups: { [ name: string ]: number } = {};
        for(var id = 0; id < monitors; id++) {
            const name = screen.get_monitor_plug_name(id) ?? undefined;

            if(name) {
                monitorLookups[name] = id;
            }
        }

        this._monitorLookups =  monitorLookups;
    }

    reloadWindows() {
        for(const window of App.windows) {
            App.removeWindow(window);
        }

        this.loadMonitorLookups();

        for(const monitor of hyprland.monitors) {
            const id = this._monitorLookups[monitor.name] ?? monitor.id;
            if(App.windows.find(x => x.name == `bar-${monitor.id}`)) {
                continue;
            }

            const bar = Bar({
                plugname: monitor.name,
                id
            });

            App.addWindow(bar);
        }
    }

    load(): void {
        hyprland.connect("monitor-added", (service, monitorName: string) => {
            const monitor = hyprland.monitors.find(x => x.name == monitorName);
            
            if(monitor) {
                console.log(`${monitorName} added`);
                
                this.reloadWindows();
            }
        });
    
        hyprland.connect("monitor-removed", (service, monitorName: string) => {
            const window = App.windows.find(x => x.name?.endsWith(monitorName));
            if(window) {
                console.log(`${monitorName} removed`);
    
                App.removeWindow(window);
            }
        });
    
        globals.optionsHandler.load();
        globals.styleHandler.load();
    
        App.config({
            // style here makes the startup look a bit nicer
            style: globals.paths.OUT_CSS_IMPORTS,
            windows: []
        });

        this.reloadWindows();

        TrayFavoritesPopupWindow.load();
    }

    cleanup(): void {
        TrayFavoritesPopupWindow.cleanup();

        globals.styleHandler.cleanup();
        globals.optionsHandler.cleanup();
    }
};