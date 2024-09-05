import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import { getBarComponents, TBarComponents } from "./bar/components/components";

type TBarLayoutItem = {
    name: keyof TBarComponents,
    props: { [key: string]: any }
};

type TBarLayout = TBarLayoutItem[];

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;
        layout: Option<TBarLayout>;
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
            validate: (value: TBarLayout) => {
                for(const val of value) {
                    if(!(val.name in getBarComponents())) {
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
                { name: "WorkspaceSelector", props: {} }
            ] as TBarLayout, validators.barComponents)
        }
    };
}; 