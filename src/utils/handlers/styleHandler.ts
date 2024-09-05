import { IReloadable } from "src/interfaces/reloadable";
import { globals } from "../../globals";
import { MonitorTypeFlags, PathMonitor } from "../pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { HEXtoCSSRGBA, HEXtoRGBA } from "../colourUtils";


const $ = (key: string, value: string) => { return `$${key}: ${value};`; }

export class StyleHandler implements IReloadable {
    private _loaded: boolean = false;
    private _monitor: PathMonitor;

    constructor() {
        this._monitor = new PathMonitor(`${App.configDir}/styles`, MonitorTypeFlags.FILE | MonitorTypeFlags.RECURSIVE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;

            this.reloadStyles();
        });
    }

    _eventCallback?: (event: string, data: any) => Promise<void>;

    load(): void {
        if(this._loaded) return;
        
        this._loaded = true;
        this._monitor.load();

        this._eventCallback = (event, data) => this.reloadStyles();
        globals.optionsHandler.on("option_changed", this._eventCallback);

        this.reloadStyles();
    }

    cleanup() {
        if(!this._loaded) return;

        this._loaded = false;
        this._monitor.cleanup();

        if(this._eventCallback) {
            globals.optionsHandler.removeListener("option_changed", this._eventCallback);

            this._eventCallback = undefined;
        }
    }


    getDynamicSCSS() {
        const { bar } = globals.optionsHandler.options;

        return [
            $("bar-background-color", HEXtoCSSRGBA(bar.background_color.value)),
            $("bar-icon-color", HEXtoCSSRGBA(bar.icon_color.value))
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