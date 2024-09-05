import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import { getBarComponents, TBarComponents } from "./bar/components/components";

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;
        layout: Option<(keyof TBarComponents)[]>;
    };
};


function getOptionValidators(): { [key: string]: OptionValidator<any> } {
    return {
        colour: {
            validate: (value: string) => {
                return /^#[0-9A-F]{8}$/.test(value);
            }
        },
        barComponents: {
            validate: (value: string[]) => {
                for(const key of value) {
                    if(!(key in getBarComponents())) {
                        return false;
                    }
                }

                return true;
            }
        }
    };
}

export function getOptions(): IOptions {
    const validators = getOptionValidators();

    return {
        bar: {
            background_color: option("#000000E0", validators.colour),
            icon_color: option("#5D93B0FF", validators.colour),
            layout: option([
                "WorkspaceSelector"
            ] as (keyof TBarComponents)[], validators.barComponents)
        }
    };
}; 