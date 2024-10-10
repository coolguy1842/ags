import { globals } from "./globals";
import { Bar } from "./bar/bar";
import { IReloadable } from "./interfaces/reloadable";

const hyprland = await Service.import("hyprland");

export class Main implements IReloadable {
    private _loaded: boolean = false;
    
    get loaded() { return this._loaded; }
    set loaded(loaded: boolean) {
        if(this._loaded == loaded) return;
        
        if(loaded) this.load();
        else this.cleanup();
    } 


    reloadWindows() {
        for(const window of App.windows) {
            App.removeWindow(window);
            window.destroy();
        }

        globals.loadMonitorLookups();

        const addedMonitors: number[] = [];
        for(const monitor of hyprland.monitors) {
            const id = globals.monitorLookups![monitor.name] ?? monitor.id;
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
        globals.load();

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
                window.destroy();
            }
        });

        App.config({
            // style here makes the startup look a bit nicer
            style: globals.paths!.OUT_CSS_IMPORTS,
            windows: []
        });

        this.reloadWindows();
    }

    cleanup(): void {
        globals.cleanup();

        for(const window of App.windows) {
            App.removeWindow(window);
        }
    }
};