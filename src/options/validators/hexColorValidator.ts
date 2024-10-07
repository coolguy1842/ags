import { OptionValidator } from "src/utils/handlers/optionsHandler";

export enum HEXColorType {
    RGB,
    RGBA
};

export class HEXColorValidator<T extends string> implements OptionValidator<T> {
    private _colorType: HEXColorType;
    
    constructor(colorType: HEXColorType = HEXColorType.RGBA) {
        this._colorType = colorType;
    }

    validate(value: T, _previousValue?: T) {
        switch(this._colorType) {
        case HEXColorType.RGB:
            return /^#[0-9A-F]{6}$/.test(value) ? value : undefined;
        case HEXColorType.RGBA:
            return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
        default: return undefined;
        }
    }
};