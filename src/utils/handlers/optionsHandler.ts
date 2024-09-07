import { IReloadable } from "src/interfaces/reloadable";
import { MonitorTypeFlags, PathMonitor } from "../pathMonitor";
import { FileMonitorEvent } from "types/@girs/gio-2.0/gio-2.0.cjs";
import { paths } from "src/paths";
import { Variable} from "resource:///com/github/Aylur/ags/variable.js";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Options } from "types/variable";

export interface OptionValidator<T> {
    // validator can override if its not a bad issue like missing option
    validate(value: T): T | undefined;
};

export class Option<T> extends Variable<T> {
    static {
        registerGObject(this, { typename: `Ags_Option_${Date.now()}` });
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
    }

    set id(id: string) { this._id = id; }
    get id() { return this._id; }

    get validator() { return this._validator; }
    get options() { return this._options; }

    get defaultValue() { return this._default; }

    get value() { return this._value; }
    set value(value: T) {
        if(this._validator) {
            const validation = this._validator.validate(value);
            if(validation == undefined) {
                // check if current/fallback is invalid too
                if(this._validator.validate(this._value) == undefined) {
                    this._value = this._default;
                }

                return;
            }
            
            this._value = validation;
        }
        else {
            this._value = value;
        }

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
        registerGObject(this, {
            typename: `Ags_OptionsHandler_${Date.now()}`,
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

    private _default: OptionsType;
    private _options: OptionsType;

    private _ignoreChange: boolean;


    get options() { return this._options; }


    constructor(options: OptionsType) {
        super();

        this._pathMonitor = new PathMonitor(paths.OPTIONS_PATH, MonitorTypeFlags.FILE, (file, fileType, event) => {
            if(event == FileMonitorEvent.CHANGED) return;
            
            if(this._ignoreChange) {
                this._ignoreChange = false;
                return;
            }

            this.loadOptions();
        });

        this._default = options;
        this._options = options;
        
        this._ignoreChange = false;
    }


    private reloadOptionsListeners(options: TOptions = this._options, path = "") {
        var oldPath = path;
        for(const key in options) {
            path = `${oldPath}${oldPath.length > 0 ? "." : ""}${key}`;
            if(options[key] instanceof Option) {
                const val = options[key];
                const newOption = option(val.value, val.validator, val.options);

                newOption.id = path;
                newOption.connect("changed", () => {
                    this.emit("option_changed", options[key]);
                    this.saveOptions();
                });

                options[key] = newOption;
                continue;
            }

            this.reloadOptionsListeners(options[key], path);
        }
    }

    load(): void {
        if(this._loaded) return;
        this._loaded = true;

        this._pathMonitor.load();
        this.reloadOptionsListeners();

        this.loadOptions();
        this.saveOptions();
    }

    cleanup(): void {
        if(!this._loaded) return;
        this._loaded = false;

        this._pathMonitor.cleanup();
        this.reloadOptionsListeners();
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
        Utils.writeFileSync(JSON.stringify(this.simplifyOptions(), undefined, 4), paths.OPTIONS_PATH);
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
            return;
        }

        for(const key in json) {
            this.setOption(key, json[key]);
        }

        this.emit("options_reloaded", this.options);

        this._ignoreChange = true;
        this.saveOptions();
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