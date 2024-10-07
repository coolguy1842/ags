import { OptionValidator } from "src/utils/handlers/optionsHandler";

export class NumberValidator<T extends number> implements OptionValidator<T> {
    private _min?: number;
    private _max?: number;

    constructor(options?: {
        min?: number,
        max?: number
    }) {
        this._min = options?.min;
        this._max = options?.max;
    }

    validate(value: T, _previousValue?: T) {
        if(isNaN(value)) return undefined;

        if(this._min && value < this._min) return this._min as T;
        if(this._max && value > this._max) return this._max as T;

        return value;
    }
};