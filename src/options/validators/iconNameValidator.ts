import Gtk from "gi://Gtk?version=3.0";
import { OptionValidator } from "src/utils/handlers/optionsHandler";
import { icon } from "src/utils/utils";

type TOptions = {};
export class IconNameValidator<T extends string> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new IconNameValidator({});
    }


    validate(value: T, _previousValue?: T) {
        if(typeof value != "string") return undefined;
        else if(value == undefined) return undefined;

        // console.log("val: " + value);
        // return icon(value) ? value : undefined;
        return value;
    }
};