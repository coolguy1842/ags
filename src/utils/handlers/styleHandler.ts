import { globals } from "../../globals";
import { IReloadable } from "src/interfaces/reloadable";
import { MonitorTypeFlags, PathMonitor } from "../classes/pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { HEXtoSCSSRGBA } from "../colorUtils";

const $ = (key: string, value: string) => `$${key}: ${value};`;

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
            globals.optionsHandler.disconnect(this._optionsListenerID);

            this._optionsListenerID = undefined;
        }
    }


    getBindings() {
        const { bar, system_tray } = globals.optionsHandler.options;
        
        return [
            bar.background,
            bar.icon_color,

            system_tray.background,
            system_tray.padding,
            system_tray.border_radius
        ];
    }

    // TODO: make bindings able to be used here that way we dont need the getBindings hack
    getDynamicSCSS() {
        const { bar, system_tray } = globals.optionsHandler.options;

        return [
            $("bar-background-color", HEXtoSCSSRGBA(bar.background.value)),
            $("bar-icon-color", HEXtoSCSSRGBA(bar.icon_color.value)),

            $("system-tray-background-color", HEXtoSCSSRGBA(system_tray.background.value)),
            $("system-tray-padding", `${system_tray.padding.value}px`),
            $("system-tray-border-radius", `${system_tray.border_radius.value}px`),
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

            const out = Utils.exec(`sassc ${globals.paths.OUT_SCSS_IMPORTS} ${globals.paths.OUT_CSS_IMPORTS}`);
            if(out.trim().length > 0) {
                console.log(out);
            }
            
            App.applyCss(globals.paths.OUT_CSS_IMPORTS, true);
        }
        catch(err) {
            console.log(err);
        }
    }
};