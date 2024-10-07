import { globals } from "../../globals";
import { IReloadable } from "src/interfaces/reloadable";
import { MonitorTypeFlags, PathMonitor } from "../classes/PathMonitor";
import { HEXtoSCSSRGBA } from "../colorUtils";

import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";

const $ = (key: string, value: string) => `$${key}: ${value};`;

export class StyleHandler implements IReloadable {
    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

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

        for(const binding of this.getBindings()) {
            binding.connect("changed", () => {
                this.reloadStyles();
            });
        }

        this.reloadStyles();
    }

    cleanup() {
        if(!this._loaded) return;

        this._loaded = false;
        this._monitor.cleanup();

        if(this._optionsListenerID) {
            globals.optionsHandler!.disconnect(this._optionsListenerID);

            this._optionsListenerID = undefined;
        }
    }


    getBindings() {
        const { bar } = globals.optionsHandler!.options;
        
        return [
            bar.background,
            bar.icon_color,
        ];
    }

    // TODO: make bindings able to be used here that way we dont need the getBindings hack
    getDynamicSCSS() {
        const { bar } = globals.optionsHandler!.options;

        return [
            $("bar-background-color", HEXtoSCSSRGBA(bar.background.value)),
            $("bar-icon-color", HEXtoSCSSRGBA(bar.icon_color.value)),
        ].join("\n");
    }

    async reloadStyles() {
        if(!this._loaded) return;

        const { paths } = globals;

        console.log("loading styles");
    
        try {
            Utils.exec(`mkdir -p ${paths!.OUT_CSS_DIR}`);

            Utils.writeFileSync(this.getDynamicSCSS(), paths!.OUT_SCSS_DYNAMIC);
            Utils.writeFileSync(
                [ paths!.OUT_SCSS_DYNAMIC, paths!.STYLES_MAIN ]
                    .map(file => `@import '${file}';`)
                    .join("\n"),

                paths!.OUT_SCSS_IMPORTS
            );

            const out = Utils.exec(`sassc ${paths!.OUT_SCSS_IMPORTS} ${paths!.OUT_CSS_IMPORTS}`);
            if(out.trim().length > 0) {
                console.log(out);
            }
            
            App.applyCss(paths!.OUT_CSS_IMPORTS, true);
        }
        catch(err) {
            console.log(err);
        }
    }
};