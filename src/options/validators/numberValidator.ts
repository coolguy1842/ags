import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {
    min?: number;
    max?: number;
};

export class NumberValidator<T extends number> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create(options?: TOptions) {
        return new NumberValidator(options);
    }


    validate(value: T, _fallback?: T) {
        if(isNaN(value)) undefined;

        const { min, max } = this._options ?? {};

        if(min && value < min) return min as T;
        if(max && value > max) return max as T;

        return value;
    }
};