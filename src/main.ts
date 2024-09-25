import { globals } from "./globals";
import { Bar } from "./bar/bar";
import { IReloadable } from "./interfaces/reloadable";
import Gdk30 from "gi://Gdk";

const hyprland = await Service.import("hyprland");

export class Main implements IReloadable {
    private _loaded: boolean = false;
    private _monitorLookups: { [name: string]: number } = {};

    get loaded() { return this._loaded; }
    set loaded(loaded: boolean) {
        if(this._loaded == loaded) return;
        
        if(loaded) this.load();
        else this.cleanup();
    } 


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

        const addedMonitors: number[] = [];
        for(const monitor of hyprland.monitors) {
            const id = this._monitorLookups[monitor.name] ?? monitor.id;
            if(addedMonitors.includes(id)) {
                continue;
            }

            const bar = Bar({
                plugname: monitor.name,
                id
            });

            App.addWindow(bar);
            addedMonitors.push(id);
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
    
        globals.load();

        App.config({
            // style here makes the startup look a bit nicer
            style: globals.paths!.OUT_CSS_IMPORTS,
            windows: []
        });

        this.reloadWindows();
    }

    cleanup(): void {
        globals.cleanup();
    }
};