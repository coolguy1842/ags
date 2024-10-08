import { OptionValidator } from "src/utils/handlers/optionsHandler";

type TOptions = {};
export class IconNameValidator<T extends string> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new IconNameValidator({});
    }


    validate(value: T, _previousValue?: T) {
        if(typeof value != "string") return undefined;
        return Utils.lookUpIcon(value) ? value : undefined;
    }
};