import { OptionValidator } from "src/utils/handlers/optionsHandler";

type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };
export class ValueInEnumValidator<E extends Enum<E>, Key extends keyof E> implements OptionValidator<E[Key]> {
    private _enumValue: E;

    constructor(enumValue: E) {
        this._enumValue = enumValue;
    }

    validate(value: E[Key], _previousValue?: E[Key]) {
        if(Object.values(this._enumValue).includes(value as any)) {
            return value; 
        }

        return undefined;
    }
};