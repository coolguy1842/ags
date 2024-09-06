import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import { getBarComponents, TBarComponents } from "./bar/components/components";
import GLib from "gi://GLib?version=2.0";

type TBarLayoutItem<T extends keyof TBarComponents> = {
    name: T,
    props: TBarComponents[T]["props"]
};

type TBarLayout = TBarLayoutItem<keyof TBarComponents>[];

function getOptionValidators(): { [key: string]: OptionValidator<any> } {
    return {
        colour: {
            validate: (value: string) => {
                return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
            }
        },
        barComponents: {
            validate: (value: TBarLayout) => {

                const haveSameKeys = (obj1, obj2) => { 
                    const obj1Length = Object.keys(obj1).length; 
                    const obj2Length = Object.keys(obj2).length; 
            
                    if (obj1Length === obj2Length) { 
                        return Object.keys(obj1).every(key => obj2.hasOwnProperty(key)); 
                    } 
                    
                    return false; 
                } 

                if(value == undefined || !Array.isArray(value)) {
                    return undefined;
                }

                for(const val of value) {
                    if(!(val.name in getBarComponents())) {
                        return undefined;
                    }

                    const component = getBarComponents()[val.name];
                    if(val.props == undefined || !haveSameKeys(val.props, component.props)) {
                        val.props = component.props;
                    }
                }

                return value;
            }
        }
    };
}

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;
        layout: {
            left: Option<TBarLayout>;
            center: Option<TBarLayout>;
            right: Option<TBarLayout>;
        }
    };
};

export function getOptions(): IOptions {
    const validators = getOptionValidators();

    return {
        bar: {
            background_color: option("#000000E0", validators.colour),
            icon_color: option("#5D93B0FF", validators.colour),
            layout: {
                left: option(
                    [
                        { name: "WorkspaceSelector", props: { test: "" } },
                        { name: "TimeAndNotificationsDisplay", props: {} }
                    ] as TBarLayout,
                    validators.barComponents
                ),
                center: option([] as TBarLayout, validators.barComponents),
                right: option([] as TBarLayout, validators.barComponents)
            }
        },
    };
}; 