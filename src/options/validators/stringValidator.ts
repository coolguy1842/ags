import { OptionValidator } from "src/utils/handlers/optionsHandler";

export class StringValidator<T extends string> implements OptionValidator<T> {
    validate(value: T, _previousValue?: T) {
        if(value == undefined) return undefined;
        return typeof value == "string" ? value : undefined;
    }
};