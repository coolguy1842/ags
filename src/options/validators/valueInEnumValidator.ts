import { OptionValidator } from "src/utils/handlers/optionsHandler";

type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };
type TOptions<E extends Enum<E>> = {
    enumObject: E
};

export class ValueInEnumValidator<E extends Enum<E>, Key extends keyof E> implements OptionValidator<E[Key]> {
    private _options: TOptions<E>;
    private constructor(options: TOptions<E>) {
        this._options = options;
    }

    static create<E extends Enum<E>>(enumObject: E) {
        return new ValueInEnumValidator({ enumObject });
    }

    
    validate(value: E[Key], _previousValue?: E[Key]) {
        if(Object.values(this._options.enumObject).includes(value as any)) {
            return value; 
        }

        return undefined;
    }
};