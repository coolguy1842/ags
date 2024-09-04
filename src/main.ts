import { Bar } from "./bar/bar";
import { IReloadable } from "./interfaces/reloadable";
import { globals } from "./utils/globals";
import { StyleHandler } from "./utils/handlers/styleHandler";

const hyprland = await Service.import("hyprland");;

export class Main implements IReloadable {
    load(): void {
        hyprland.connect("monitor-added", (service, monitorName: string) => {
            const monitor = hyprland.monitors.find(x => x.name == monitorName);
            
            if(monitor) {
                console.log(`${monitorName} added`);
                App.addWindow(Bar(monitor));
            }
        });
    
        hyprland.connect("monitor-removed", (service, monitorName: string) => {
            const window = App.windows.find(x => x.name?.endsWith(monitorName));
            if(window) {
                console.log(`${monitorName} removed`);
    
                App.removeWindow(window);
            }
        });
    
        for(const window of App.windows) {
            App.removeWindow(window);
        }
    
        globals.optionsHandler.load();
        globals.styleHandler.load();
    
        App.config({
            // style here makes the startup look a bit nicer
            style: globals.paths.OUT_CSS_IMPORTS,
            windows: [
                ...hyprland.monitors.map(x => Bar(x))
            ]
        });
    }

    cleanup(): void {
        globals.styleHandler.cleanup();
        globals.optionsHandler.cleanup();
    }
};