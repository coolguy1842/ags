import { IReloadable } from "src/interfaces/reloadable";
import { MonitorTypeFlags, PathMonitor } from "../classes/PathMonitor";
import { Options } from "types/variable";

import { Variable} from "resource:///com/github/Aylur/ags/variable.js";

import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { globals } from "src/globals";
import { registerObject } from "../utils";

export interface OptionValidator<T> {
    validate(value: T, fallback?: T): T | undefined;
};

export class Option<T> extends Variable<T> {
    static {
        registerObject(this);
    }

    private _id: string;

    private _default: T;
    private _validator?: OptionValidator<T>;
    private _options?: Options<T>;

    // relies on default being valid
    constructor(value: T, validator?: OptionValidator<T>, options?: Options<T>) {
        super(value, options);

        this._id = "";

        this._default = value;
        this._validator = validator;
        this._options = options;

        this.value = value;
    }


    setValue = (value: T) => {
        this.value = value;
    }

    getValue = (): T => {
        return super.getValue();
    }

    set id(id: string) { this._id = id; }
    get id() { return this._id; }

    get validator() { return this._validator; }
    get options() { return this._options; }

    get defaultValue() { return this._default; }

    get value() { return this._value; }
    set value(value: T) {
        if(this._validator) {
            const validation = this._validator.validate(value, this._value);
            if(validation == undefined) {
                // check if current/fallback is invalid too
                if(this._validator.validate(this._value, this._default) == undefined) {
                    this._value = this._default;

                    this.notify('value');
                    this.emit('changed');
                }

                return;
            }
            
            this._value = validation;

            this.notify('value');
            this.emit('changed');
            return;
        }

        this._value = value;
        
        this.notify('value');
        this.emit('changed');
    }

    toJSON() { return this.value; }
    toString() { return this.value; }
};

export function option<T>(value: T, validator?: OptionValidator<T>, options?: Options<T>) { return new Option<T>(value, validator, options); }


export type TOptions = {
    [key: string]: Option<any> | TOptions;
};

export type OptionsHandlerCallback = (...args: any) => void;
export class OptionsHandler<OptionsType extends TOptions> extends Service implements IReloadable {
    static {
        // register gobject like this to enable hotreloading of this class
        registerObject(this, {
            signals: {
                "options_reloaded": ["jsobject"],
                "option_changed": ["jsobject"]
            },
            properties: {
                "options": ["jsobject", "r"]
            }
        });
    }

    private _loaded: boolean = false;

    private _pathMonitor: PathMonitor;

    private _defaultOptionsGenerator: () => OptionsType;

    private _defaultOptions: OptionsType;
    private _options: OptionsType;
    private _prevOptions: string;

    private _ignoreChange: boolean;


    get loaded() { return this._loaded; }
    get options() { return this._options; }

    constructor(defaultOptionsGenerator: () => OptionsType) {
        super();

        this._defaultOptionsGenerator = defaultOptionsGenerator;
        this._pathMonitor = new PathMonitor(globals.paths.OPTIONS_PATH, MonitorTypeFlags.FILE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;
            
            if(this._ignoreChange) {
                this._ignoreChange = false;
                return;
            }

            this.loadOptions();
        });

        this._options = this._defaultOptionsGenerator();
        this._defaultOptions = this._defaultOptionsGenerator();

        this._prevOptions = "";
        
        this._ignoreChange = false;
    }


    private loadOptionsListeners(reload: boolean, options: TOptions = this._options, path = "") {
        var oldPath = path;
        for(const key in options) {
            path = `${oldPath}${oldPath.length > 0 ? "." : ""}${key}`;
            if(options[key] instanceof Option) {
                if(reload) {
                    const val = options[key];

                    const newOption = option(val.value, val.validator, val.options);
                    
                    newOption.id = path;
                    newOption.connect("changed", () => {
                        this.emit("option_changed", options[key]);
                        this.saveOptions();
                    });

                    options[key] = newOption;
                }
                else {
                    options[key].id = path;
                    options[key].connect("changed", () => {
                        this.emit("option_changed", options[key]);
                        this.saveOptions();
                    });
                }

                continue;
            }

            this.loadOptionsListeners(reload, options[key], path);
        }
    }

    load(): void {
        if(this._loaded) return;
        this._loaded = true;

        this._pathMonitor.load();
        this.loadOptionsListeners(false);

        var firstLoaded = true;
        this.connect("options_reloaded", () => {
            console.log(`options ${!firstLoaded ? "re" : ""}loaded`);

            firstLoaded = false;
        });

        this.loadOptions();
        this.saveOptions();
    }

    cleanup(): void {
        if(!this._loaded) return;
        this._loaded = false;

        this._pathMonitor.cleanup();
        this.loadOptionsListeners(true);
    }


    private simplifyOptions(options: TOptions = this._options) {
        var out = {};
        for(const key of Object.keys(options)) {
            const value = options[key];
            if(value instanceof Option) {
                out[value.id] = value;
                continue;
            }

            const obj = this.simplifyOptions(value);
            for(const k in obj) {
                out[k] = obj[k];
            }
        }

        return out;
    }

    private saveOptions() {
        Utils.writeFileSync(JSON.stringify(this.simplifyOptions(), undefined, 4), globals.paths.OPTIONS_PATH);
        this._prevOptions = JSON.stringify(this._options);
    }

    private loadOptions() {
        const text = Utils.readFile(globals.paths.OPTIONS_PATH);
        if(text == "") return;
        
        let json: {};

        try {
            json = JSON.parse(text);
        }
        catch(err) {
            console.log(err);
            return;
        }

        const prevText = this._prevOptions;
        for(const key in json) {
            this.setOption(key, json[key]);
        }

        const newText = JSON.stringify(this._options);

        if(newText != text) {
            this.saveOptions();
        }

        if(prevText == newText) {
            return;
        }

        this._prevOptions = newText;
        this.emit("options_reloaded", this.options);

        this._ignoreChange = true;
    }


    private setOption(path: string, value: any) {
        const keys = path.split(".");

        var cur: TOptions | Option<any> = this._options;
        var i = 0;
        while(i < keys.length) {
            if(!(keys[i] in cur)) return;
            cur = cur[keys[i++]];

            if(cur instanceof Option) {
                if(cur.id != path) return;

                break;
            }
        }

        if(JSON.stringify(cur.value) != JSON.stringify(value)) {
            cur.value = value;
        }
    }

};