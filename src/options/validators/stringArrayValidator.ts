import { OptionValidator } from "src/utils/handlers/optionsHandler";

export class StringArrayValidator<T extends string[]> implements OptionValidator<T> {
    validate(value: T, _previousValue?: T) {
        if(value == undefined || !Array.isArray(value)) return undefined;
        return value.every(x => typeof x == "string") ? value : undefined;
    }
};