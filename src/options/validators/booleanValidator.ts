import { OptionValidator } from "src/utils/handlers/optionsHandler";

export class BooleanValidator<T extends boolean> implements OptionValidator<T> {
    validate(value: T, _previousValue?: T) {
        return typeof value == "boolean" ? value : undefined;
    }
};