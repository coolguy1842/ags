import { Bar } from "./bar/bar";
import { globals } from "./utils/globals";
import { OptionsHandler } from "./utils/optionsHandler";
import { StyleHandler } from "./utils/styleHandler";

const hyprland = await Service.import("hyprland");;

export function init() {
    cleanup();

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

    globals.options = new OptionsHandler(globals.defaultOptions, globals.paths.OPTIONS_PATH);
    globals.styleHandler = new StyleHandler(globals.paths.STYLES_MAIN);

    App.config({
        // style here makes the startup look a bit nicer
        style: globals.paths.OUT_CSS_IMPORTS,
        windows: [
            ...hyprland.monitors.map(x => Bar(x))
        ]
    });
}

// unloads stuff for hotreloading
export function cleanup() {
    if(globals.styleHandler != undefined) {
        globals.styleHandler.cleanup();
        globals.styleHandler = undefined;
    }

    if(globals.options != undefined) {
        globals.options.cleanup();
        globals.options = undefined;
    }
}