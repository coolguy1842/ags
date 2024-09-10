import { IReloadable } from "src/interfaces/reloadable";
import { globals } from "../../globals";
import { MonitorTypeFlags, PathMonitor } from "../pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { HEXtoCSSRGBA, HEXtoRGBA } from "../colorUtils";
import { Option } from "./optionsHandler";


const $ = (key: string, value: string) => { return `$${key}: ${value};`; }

export class StyleHandler implements IReloadable {
    private _loaded: boolean = false;
    private _monitor: PathMonitor;

    private _optionsListenerID?: number;

    constructor() {
        this._monitor = new PathMonitor(`${App.configDir}/styles`, MonitorTypeFlags.FILE | MonitorTypeFlags.RECURSIVE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;

            this.reloadStyles();
        });
    }

    load(): void {
        if(this._loaded) return;
        
        this._loaded = true;
        this._monitor.load();

        this._optionsListenerID = globals.optionsHandler.connect("option_changed", (_, option: Option<any>) => {
            switch(option.id) {
            case "bar.background_color":
            case "bar.icon_color":

            case "bar.quick_menu.background":
            case "bar.quick_menu.border_radius":
            case "bar.quick_menu.side_padding":

            case "bar.system_tray.background":
            case "bar.system_tray.border_radius":
            case "bar.system_tray.side_padding":


            case "system_tray.background":
            case "system_tray.border_radius":
            case "system_tray.padding":


            case "app_launcher.background":
            case "app_launcher.border_radius":
            case "app_launcher.padding":
            case "app_launcher.seperator_background":
                break;
            default: return;
            }

            this.reloadStyles();
        });

        this.reloadStyles();
    }

    cleanup() {
        if(!this._loaded) return;

        this._loaded = false;
        this._monitor.cleanup();

        if(this._optionsListenerID) {
            globals.optionsHandler.disconnect(this._optionsListenerID);

            this._optionsListenerID = undefined;
        }
    }


    getDynamicSCSS() {
        const { bar, system_tray, app_launcher } = globals.optionsHandler.options;

        return [
            $("bar-background-color", HEXtoCSSRGBA(bar.background_color.value)),
            $("bar-icon-color", HEXtoCSSRGBA(bar.icon_color.value)),
            
            $("bar-quick-menu-button-background-color", HEXtoCSSRGBA(bar.quick_menu.background.value)),
            $("bar-quick-menu-button-border-radius", `${bar.quick_menu.border_radius.value}px`),
            $("bar-quick-menu-button-side-padding", `${bar.quick_menu.side_padding.value}px`),

            $("bar-system-tray-background-color", HEXtoCSSRGBA(bar.system_tray.background.value)),
            $("bar-system-tray-border-radius", `${bar.system_tray.border_radius.value}px`),
            $("bar-system-tray-side-padding", `${bar.system_tray.side_padding.value}px`),


            $("system-tray-background-color", HEXtoCSSRGBA(system_tray.background.value)),
            $("system-tray-border-radius", `${system_tray.border_radius.value}px`),
            $("system-tray-padding", `${system_tray.padding.value}px`),


            $("app-launcher-background-color", HEXtoCSSRGBA(app_launcher.background.value)),
            $("app-launcher-border-radius", `${app_launcher.border_radius.value}px`),
            $("app-launcher-padding", `${app_launcher.padding.value}px`),
            $("app-launcher-seperator-background-color", HEXtoCSSRGBA(app_launcher.seperator_background.value))
        ].join("\n");
    }

    async reloadStyles() {
        if(!this._loaded) return;

        console.log("loading styles");
    
        try {
            Utils.exec(`mkdir -p ${globals.paths.OUT_CSS_DIR}`);

            Utils.writeFileSync(this.getDynamicSCSS(), globals.paths.OUT_SCSS_DYNAMIC);
            Utils.writeFileSync(
                [ globals.paths.OUT_SCSS_DYNAMIC, globals.paths.STYLES_MAIN ]
                    .map(file => `@import '${file}';`)
                    .join("\n"),

                globals.paths.OUT_SCSS_IMPORTS
            );

            Utils.exec(`sassc ${globals.paths.OUT_SCSS_IMPORTS} ${globals.paths.OUT_CSS_IMPORTS}`);

            App.applyCss(globals.paths.OUT_CSS_IMPORTS, true);
        }
        catch(err) {
            console.log(err);
        }
    }
};