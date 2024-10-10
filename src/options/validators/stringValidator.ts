import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {};
export class StringValidator<T extends string> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new StringValidator({});
    }


    validate(value: T, _previousValue?: T) {
        if(value == undefined) return undefined;
        return typeof value == "string" ? value : undefined;
    }
};