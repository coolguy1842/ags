import { Bar } from "./bar/bar";
import { OUT_CSS_IMPORTS, STYLES_MAIN } from "./utils/globals";
import { StyleHandler } from "./utils/styleHandler";

const hyprland = await Service.import("hyprland");
let styleHandler: StyleHandler | null = null;

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

    styleHandler = new StyleHandler(STYLES_MAIN);

    App.config({
        // style here makes the startup look a bit nicer
        style: OUT_CSS_IMPORTS,
        windows: [
            ...hyprland.monitors.map(x => Bar(x))
        ]
    });
}

// unloads stuff for hotreloading
export function cleanup() {
    if(styleHandler != null) {
        styleHandler.cleanup();
        styleHandler = null;
    }
}