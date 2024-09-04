import { IReloadable } from "src/interfaces/reloadable";
import { EventHandler } from "./eventHandler";

type OptionEvents = {
    changed: { }
};

export class Option<T> extends EventHandler<OptionEvents> {
    private _value: T;

    constructor(value: T) {
        super([ "changed" ]);

        this._value = value;
    }

    get value() { return this._value; }
    set value(value: T) { this._value = value; }


    clearListeners() { this.reloadListeners(); }
};

export function option(value: any) { return new Option(value); }


export type TOptions = {
    [key: string]: any | TOptions;
};

type OptionsHandlerEvents = {
    option_changed: { option: string },
    options_reloaded: { }
    options_set: { }
};

export type OptionsHandlerCallback = (...args: any) => void;
export class OptionsHandler<OptionsType extends TOptions> extends EventHandler<OptionsHandlerEvents> implements IReloadable {
    private _loaded: boolean = false;

    private _options: OptionsType;

    constructor(options: OptionsType) {
        super([ "option_changed", "options_reloaded", "options_set" ]);

        this._options = options;
    }

    load(): void {
        if(this._loaded) return;
        this._loaded = true;

        this.reloadListeners();
    }

    cleanup(): void {
        if(!this._loaded) return;
        this._loaded = false;

        this.reloadListeners();
    }



    get options() { return this._options; }
    set options(newOptions: OptionsType) {
        this._options = newOptions;

        this.emit("options_set", {});
    }
};