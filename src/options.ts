import { option, Option, OptionValidators, TOptions } from "./utils/handlers/optionsHandler";

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;
    };

    test: Option<number>;
};

export const options: IOptions = {
    bar: {
        background_color: option("#000000E0", OptionValidators["colour"]),
        icon_color: option("#5D93B0FF", OptionValidators["colour"])
    }
}; 