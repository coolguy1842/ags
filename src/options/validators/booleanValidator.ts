import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {};
export class BooleanValidator<T extends boolean> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new BooleanValidator({});
    }


    validate(value: T, _previousValue?: T) {
        return typeof value == "boolean" ? value : undefined;
    }
};