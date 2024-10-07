import { OptionValidator } from "src/utils/handlers/optionsHandler";

export class IconNameValidator<T extends string> implements OptionValidator<T> {
    validate(value: T, _previousValue?: T) {
        if(typeof value != "string") return undefined;
        return Utils.lookUpIcon(value) ? value : undefined;
    }
};