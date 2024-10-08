import GLib from "gi://GLib";
import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {};
export class ClockFormatValidator<T extends string> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new ClockFormatValidator({});
    }


    validate(value: T, previousValue?: T) {
        const formatted = GLib.DateTime.new_now_local().format(value);
        if(formatted == null) {
            return previousValue;
        }

        return value;
    }
};