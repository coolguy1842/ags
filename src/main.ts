import { Bar } from "./bar/bar";
import { IReloadable } from "./interfaces/reloadable";
import { globals } from "./globals";
import Gdk30 from "gi://Gdk";

const hyprland = await Service.import("hyprland");

export class Main implements IReloadable {
    private _monitorLookups: { [name: string]: number } = {};

    loadMonitorLookups() {
        // not fully tested, allows for monitors to be added and removed and shows on the right monitor properly
        const screen = Gdk30.Screen.get_default();
        const monitors = screen?.get_n_monitors() ?? 0;

        const monitorLookups: { [ name: string ]: number } = {};
        for(var id = 0; id < monitors; id++) {
            const name = screen?.get_monitor_plug_name(id) ?? undefined;

            if(name) {
                monitorLookups[name] = id;
            }
        }
    }

    reloadWindows() {
        for(const window of App.windows) {
            App.removeWindow(window);
        }

        this.loadMonitorLookups();

        for(const window of [
            ...hyprland.monitors.map(x => Bar({
                name: x.name,
                mon_id: x.id,
                gtk_id: this._monitorLookups[x.name] ?? x.id
            }))
        ]) {
            App.addWindow(window);
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
    }

    cleanup(): void {
        globals.styleHandler.cleanup();
        globals.optionsHandler.cleanup();
    }
};