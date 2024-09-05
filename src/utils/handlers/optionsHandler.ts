import { IReloadable } from "src/interfaces/reloadable";
import { EventHandler } from "./eventHandler";
import { MonitorTypeFlags, PathMonitor } from "../pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { paths } from "src/paths";
import GLib from "types/@girs/glib-2.0/glib-2.0";

type OptionEvents = {
    changed: { }
};

interface OptionValidator<T> {
    validate(value: T): boolean;  
};

export const OptionValidators: { [key: string]: OptionValidator<any> } = {
    "colour": {
        validate: (value: string) => {
            return /^#[0-9A-F]{8}$/.test(value);
        }
    }
};

export class Option<T> extends EventHandler<OptionEvents> {
    private _default: T;
    private _value: T;

    private _validator?: OptionValidator<T>;

    // relies on default being valid
    constructor(value: T, validator?: OptionValidator<T>) {
        super([ "changed" ]);

        this._default = value;
        this._value = value;

        console.log(validator);

        this._validator = validator;
    }

    get value() { return this._value; }
    set value(value: T) {
        if(this._validator) {
            if(!this._validator.validate(value)) {
                return;
            }
        }

        this._value = value;

        this.emit("changed", {});
    }


    clearListeners() { this.reloadListeners(); }

    toJSON() { return `option::${JSON.stringify(this.value)}`; }
    toString() { return this.value; }
};

export function option<T>(value: T, validator?: OptionValidator<T>) { return new Option<T>(value, validator); }


export type TOptions = {
    [key: string]: Option<any> | TOptions;
};

type OptionsHandlerEvents = {
    option_changed: { option: string },
    options_reloaded: { }
    options_set: { }
};

export type OptionsHandlerCallback = (...args: any) => void;
export class OptionsHandler<OptionsType extends TOptions> extends EventHandler<OptionsHandlerEvents> implements IReloadable {
    private _loaded: boolean = false;

    private _pathMonitor: PathMonitor;

    private _default: OptionsType;
    private _options: OptionsType;

    private _ignoreChange: boolean = false;
    private _saveTimeout?: GLib.Source;

    constructor(options: OptionsType) {
        super([ "option_changed", "options_reloaded", "options_set" ]);

        this._pathMonitor = new PathMonitor(paths.OPTIONS_PATH, MonitorTypeFlags.FILE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;
            
            if(this._ignoreChange) {
                this._ignoreChange = false;
            }

            this.loadOptions();
        });

        this._default = options;
        this._options = options;
    }


    private reloadOptionsListeners(options: TOptions = this._options) {
        for(const key in options) {
            if(options[key] instanceof Option) {
                options[key].clearListeners();
                options[key].on("changed", () => {
                    this.emit("option_changed", { option: key });
                });

                continue;
            }

            this.reloadOptionsListeners(options[key]);    
        }
    }

    load(): void {
        if(this._loaded) return;
        this._loaded = true;

        this._pathMonitor.load();

        this.reloadListeners();
        this.reloadOptionsListeners();

        this.loadOptions();
        this.saveOptions();
    }

    cleanup(): void {
        if(!this._loaded) return;
        this._loaded = false;

        this._pathMonitor.cleanup();

        this.reloadListeners();
        this.reloadOptionsListeners();
    }


    private stringifyOptions() { return JSON.stringify(this.options, null, 4); }
    private saveOptions() {
        Utils.writeFileSync(this.stringifyOptions(), paths.OPTIONS_PATH);
    }

    private loadOptions() {
        const text = Utils.readFile(paths.OPTIONS_PATH);
        let json;

        this._options = this._default;
        try {
            json = JSON.parse(text);
        }
        catch(err) {
            console.log(err);
            this.saveOptions();
        }

        const loadOptionValue = (value: string): any | undefined => {
            if(!value.startsWith("option::")) return undefined;

            return JSON.parse(value.split("::").slice(1).join("::"));
        }

        const loadNestedOptions = (json: any, options: TOptions) => {
            for(const key in json) {
                if(!(key in options)) continue;

                switch(typeof json[key]) {
                case "string":
                    if(!(options[key] instanceof Option)) {
                        break;
                    }

                    const value = loadOptionValue(json[key]);
                    if(value == undefined) break;

                    if(options[key].value != value) {
                        options[key].value = value;
                    }

                    break;
                case "object":
                    if(options[key] instanceof Option) {
                        break;
                    }

                    loadNestedOptions(json[key], options[key]);
                    break;
                default: break;
                }
            }
        };
        
        loadNestedOptions(json, this._options);
        this.emit("options_reloaded", {});

        if(this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = undefined;
        }

        this._saveTimeout = setTimeout(() => {
            this._ignoreChange = true;
            this.saveOptions();
        }, 100);
    }

    get options() { return this._options; }
    set options(newOptions: OptionsType) {
        const setNestedOptions = (options: TOptions, newOptions: TOptions) => {
            for(const key in options) {
                if(options[key] instanceof Option) {
                    if(newOptions[key].value != options[key].value) {
                        options[key].value = newOptions[key].value;
                    }
    
                    continue;
                }
    
                setNestedOptions(options[key], newOptions[key] as TOptions);
            }
        };

        setNestedOptions(this._options, newOptions);
        this.emit("options_set", {});

        if(this._saveTimeout) {
            clearTimeout(this._saveTimeout);
            this._saveTimeout = undefined;
        }
        
        this._saveTimeout = setTimeout(() => {
            this._ignoreChange = true;
            this.saveOptions();
        }, 100);
    }
};