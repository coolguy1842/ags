import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import { getBarComponents, TBarComponents } from "./bar/components/components";
import GLib from "gi://GLib?version=2.0";

type TBarLayoutItem<T extends keyof TBarComponents> = {
    name: T,
    props: TBarComponents[T]["props"]
};

type TBarLayout = {
    left?: TBarLayoutItem<keyof TBarComponents>[],
    center?: TBarLayoutItem<keyof TBarComponents>[],
    right?: TBarLayoutItem<keyof TBarComponents>[]
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

                const haveSameKeys = (obj1, obj2) => { 
                    const obj1Length = Object.keys(obj1).length; 
                    const obj2Length = Object.keys(obj2).length; 
            
                    if (obj1Length === obj2Length) { 
                        return Object.keys(obj1).every(key => obj2.hasOwnProperty(key)); 
                    } 
                    
                    return false; 
                } 
            
                const validateSection = (section: "left" | "center" | "right") => {
                    var sectionArr: TBarLayoutItem<keyof TBarComponents>[] | undefined = undefined;
                    switch(section) {
                    case "left": sectionArr = value.left; break;
                    case "center": sectionArr = value.center; break;
                    case "right": sectionArr = value.right; break;
                    }

                    if(sectionArr == undefined) return true;
                    else if(!Array.isArray(sectionArr)) return false;

                    for(const val of sectionArr) {
                        if(!(val.name in getBarComponents())) {
                            return false;
                        }

                        if(val.props == undefined) {
                            return false;
                        }

                        const component = getBarComponents()[val.name];
                        if(!haveSameKeys(val.props, component.props)) {
                            return false;
                        }
                    }

                    return true;
                }

                return ["left", "center", "right"].every(section => validateSection(section as any));
            }
        }
    };
}

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;
        layout: Option<TBarLayout>;
    };
};

export function getOptions(): IOptions {
    const validators = getOptionValidators();

    return {
        bar: {
            background_color: option("#000000E0", validators.colour),
            icon_color: option("#5D93B0FF", validators.colour),
            layout: option(
                {
                    left: [
                        { name: "WorkspaceSelector", props: { test: "" } },
                        { name: "TimeAndNotificationsDisplay", props: {} }
                    ]
                } as TBarLayout,
                validators.barComponents
            )
        },
    };
}; 