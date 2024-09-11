import { IReloadable } from "src/interfaces/reloadable";
import { globals } from "../../globals";
import { MonitorTypeFlags, PathMonitor } from "../pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { HEXtoCSSRGBA } from "../colorUtils";
import { Option } from "./optionsHandler";


const $ = (key: string, value: string) => { return `$${key}: ${value};`; }

// TODO: refactor this to work better, dont like the switch case i have
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
            case "bar.background": case "bar.icon_color":
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
        const { bar } = globals.optionsHandler.options;

        return [
            $("bar-background-color", HEXtoCSSRGBA(bar.background.value)),
            $("bar-icon-color", HEXtoCSSRGBA(bar.icon_color.value)),
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