import { globals } from "../../globals";
import { IReloadable } from "src/interfaces/reloadable";
import { MonitorTypeFlags, PathMonitor } from "../classes/PathMonitor";
import { HEXtoSCSSRGBA } from "../colorUtils";

import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { Variable } from "types/variable";
import { Option } from "./optionsHandler";

const $ = (key: string, value: string) => `$${key}: ${value};`;


class DynamicSCSSVariable<TVariables extends Variable<any>[]> implements IReloadable {
    private _variables: TVariables;
    private _transformFunc: () => string;
    private _updateFunc: (transformed: string) => void;

    private _loaded: boolean;
    get loaded() { return this._loaded; }
    
    constructor(variables: TVariables, transformFunc: () => string, updateFunc: (transformed: string) => void) {
        this._variables = variables;
        this._transformFunc = transformFunc;
        this._updateFunc = updateFunc;

        this._loaded = false;
    }

    load(): void {
        if(this._loaded) return;

        for(const variable of this._variables) {
            variable.connect("changed", () => this._updateFunc(this._transformFunc()));
        }

        this._loaded = true;
    }

    cleanup(): void {
        if(!this._loaded) return;

        this._loaded = false;
    }

    getTransformed() { return this._transformFunc(); }
};


export class StyleHandler implements IReloadable {
    private _loaded: boolean = false;
    get loaded() { return this._loaded; }

    private _monitor: PathMonitor;
    private _optionsListenerID?: number;

    private _dynamicSCSSVariables?: DynamicSCSSVariable<any>[];

    constructor() {
        this._monitor = new PathMonitor(`${App.configDir}/styles`, MonitorTypeFlags.FILE | MonitorTypeFlags.RECURSIVE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;

            this.reloadStyles();
        });
    }

    load(): void {
        if(this._loaded) return;
        
        this._monitor.load();

        this._dynamicSCSSVariables = this.getDynamicSCSSVariables();
        for(const variable of this._dynamicSCSSVariables) {
            variable.load();
        }

        this._loaded = true;
        this.reloadStyles();
    }

    cleanup() {
        if(!this._loaded) return;

        this._monitor.cleanup();

        if(this._optionsListenerID) {
            globals.optionsHandler!.disconnect(this._optionsListenerID);

            this._optionsListenerID = undefined;
        }
        
        for(const variable of this._dynamicSCSSVariables ?? []) {
            variable.cleanup();
        }

        this._dynamicSCSSVariables = undefined;
        this._loaded = false;
    }


    getDynamicSCSSVariables(): DynamicSCSSVariable<any>[] {
        const { bar, system_tray, app_launcher } = globals.optionsHandler!.options;

        const genVariable = (vars: Option<any>[], transformFunc: () => string) => {
            return new DynamicSCSSVariable(vars, transformFunc, () => this.reloadStyles());
        };

        return [
            genVariable([ bar.background ], () => $("bar-background-color", HEXtoSCSSRGBA(bar.background.value))),
            genVariable([ bar.icon_color ], () => $("bar-icon-color", HEXtoSCSSRGBA(bar.icon_color.value))),
            genVariable([ bar.outer_padding ], () => $("bar-outer-padding", `${bar.outer_padding.value}px`)),

            
            genVariable([ system_tray.background ], () => $("system-tray-background-color", HEXtoSCSSRGBA(system_tray.background.value))),
            genVariable([ system_tray.border_radius ], () => $("system-tray-border-radius", `${system_tray.border_radius.value}px`)),
            genVariable([ system_tray.padding ], () => $("system-tray-padding", `${system_tray.padding.value}px`)),

            
            genVariable([ app_launcher.background ], () => $("app-launcher-background-color", HEXtoSCSSRGBA(app_launcher.background.value))),
            genVariable([ app_launcher.padding ], () => $("app-launcher-padding", `${app_launcher.padding.value}px`)),
            genVariable([ app_launcher.border_radius ], () => $("app-launcher-border-radius", `${app_launcher.border_radius.value}px`)),

            genVariable([ app_launcher.input.background ], () => $("app-launcher-input-background-color", HEXtoSCSSRGBA(app_launcher.input.background.value))),
            genVariable([ app_launcher.input.border_radius ], () => $("app-launcher-input-border-radius", `${app_launcher.input.border_radius.value}px`)),

            genVariable([ app_launcher.app_item.background ], () => $("app-launcher-app-item-background-color", HEXtoSCSSRGBA(app_launcher.app_item.background.value))),
            genVariable([ app_launcher.app_item.background_selected ], () => $("app-launcher-app-item-selected-background-color", HEXtoSCSSRGBA(app_launcher.app_item.background_selected.value))),
            genVariable([ app_launcher.app_item.border_radius ], () => $("app-launcher-app-item-border-radius", `${app_launcher.app_item.border_radius.value}px`)),
            genVariable([ app_launcher.app_item.padding ], () => $("app-launcher-app-item-padding", `${app_launcher.app_item.padding.value}px`))
        ];
    }

    async reloadStyles() {
        if(!this._loaded) return;

        const { paths } = globals;

        console.log("loading styles");
    
        try {
            Utils.exec(`mkdir -p ${paths!.OUT_CSS_DIR}`);

            Utils.writeFileSync((this._dynamicSCSSVariables ?? []).map(x => x.getTransformed()).join("\n"), paths!.OUT_SCSS_DYNAMIC);
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