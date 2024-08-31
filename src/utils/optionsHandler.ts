

type OptionsType = {
    [key: string]: any | OptionsType
};

export class OptionsHandler<OptionsType> {
    private _options: OptionsType;

    constructor(options: OptionsType) {
        this._options = options;
    }

    get options() { return this._options; }
};