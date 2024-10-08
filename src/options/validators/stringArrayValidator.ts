import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {};
export class StringArrayValidator<T extends string[]> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new StringArrayValidator({});
    }


    validate(value: T, _previousValue?: T) {
        if(value == undefined || !Array.isArray(value)) return undefined;
        return value.every(x => typeof x == "string") ? value : undefined;
    }
};