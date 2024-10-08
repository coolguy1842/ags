import { OptionValidator } from "src/utils/handlers/optionsHandler";

export enum HEXColorType {
    RGB,
    RGBA
};

type TOptions = {
    colorType: HEXColorType
};

export class HEXColorValidator<T extends string> implements OptionValidator<T> {
    private _options: TOptions;
    private constructor(options: TOptions) {
        this._options = options;
    }

    static create(colorType: HEXColorType = HEXColorType.RGBA) {
        return new HEXColorValidator({ colorType });
    }

    validate(value: T, _previousValue?: T) {
        switch(this._options.colorType) {
        case HEXColorType.RGB:
            return /^#[0-9A-F]{6}$/.test(value) ? value : undefined;
        case HEXColorType.RGBA:
            return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
        default: return undefined;
        }
    }
};