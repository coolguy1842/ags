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
        const { bar, system_tray, app_launcher } = globals.optionsHandler!.options;
        
        return [
            bar.background,
            bar.icon_color,

            system_tray.background,
            system_tray.border_radius,
            system_tray.padding,

            app_launcher.background,
            app_launcher.border_radius,
            app_launcher.padding,

            app_launcher.search.background,
            app_launcher.search.border_radius,

            app_launcher.application.background,
            app_launcher.application.background_selected,
            app_launcher.application.padding,
            app_launcher.application.border_radius,

            app_launcher.title_color
        ];
    }

    // TODO: make bindings able to be used here that way we dont need the getBindings hack
    getDynamicSCSS() {
        const { bar, system_tray, app_launcher } = globals.optionsHandler!.options;

        return [
            $("bar-background-color", HEXtoSCSSRGBA(bar.background.value)),
            $("bar-icon-color", HEXtoSCSSRGBA(bar.icon_color.value)),

            $("system-tray-background-color", HEXtoSCSSRGBA(system_tray.background.value)),
            $("system-tray-border-radius", `${system_tray.border_radius.value}px`),
            $("system-tray-padding", `${system_tray.padding.value}px`),

            $("app-launcher-background-color", HEXtoSCSSRGBA(app_launcher.background.value)),
            $("app-launcher-border-radius", `${app_launcher.border_radius.value}px`),
            $("app-launcher-padding", `${app_launcher.padding.value}px`),

            $("app-launcher-search-background-color", HEXtoSCSSRGBA(app_launcher.search.background.value)),
            $("app-launcher-search-border-radius", `${app_launcher.search.border_radius.value}px`),

            $("app-launcher-item-background-color", HEXtoSCSSRGBA(app_launcher.application.background.value)),
            $("app-launcher-item-background-color-selected", HEXtoSCSSRGBA(app_launcher.application.background_selected.value)),
            $("app-launcher-item-padding", `${app_launcher.application.padding.value}px`),
            $("app-launcher-item-border-radius", `${app_launcher.application.border_radius.value}px`),

            $("app-launcher-title-text-color", HEXtoSCSSRGBA(app_launcher.title_color.value))
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