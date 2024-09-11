import { BarWidgets } from "./bar/widgets/widgets";
import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";

type TBarLayoutItem<T extends keyof (typeof BarWidgets)> = {
    name: T,
    props: (typeof BarWidgets)[T]["defaultProps"]
};

type TBarLayout = TBarLayoutItem<keyof (typeof BarWidgets)>[];

function getOptionValidators(): { [key: string]: OptionValidator<any> } {
    return {
        number: {
            validate: (value: number) => {
                return isNaN(value) ? undefined : value;
            }
        },
        boolean: {
            validate: (value: boolean) => {
                return value == true || value == false ? value : undefined;
            }  
        },
        color: {
            validate: (value: string) => {
                return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
            }
        },
        barWidgets: {
            validate: (value: TBarLayout) => {
                if(value == undefined || !Array.isArray(value)) {
                    return undefined;
                }

                for(const val of value) {
                    if(!(val.name in BarWidgets)) {
                        return undefined;
                    }

                    const component = BarWidgets[val.name];
                    if(val.props == undefined) {
                        val.props = component.defaultProps;
                    }

                    const props = component.propsValidator(val.props);
                    val.props = props ?? component.defaultProps;
                }

                return value;
            }
        },
        stringArray: {
            validate: (value: string[]) => {
                if(value == undefined || !Array.isArray(value)) return undefined;
                return value.every(x => typeof x == "string") ? value : undefined;
            }
        },
        iconName: {
            validate: (value: string) => {
                if(typeof value != "string") return undefined;

                return Utils.lookUpIcon(value) ? value : undefined;
            }
        }
    };
}

export interface IOptions extends TOptions {
    icons: {
        app_launcher: {
            search: Option<string>
        }
    },

    bar: {
        background: Option<string>;
        icon_color: Option<string>;

        layout: {
            outer_gap: Option<number>;
            gap: Option<number>;

            left: Option<TBarLayout>;
            center: Option<TBarLayout>;
            right: Option<TBarLayout>;
        };
    };
};

export function getOptions() {
    const validators = getOptionValidators();
    
    return {
        icons: {
            app_launcher: {
                search: option("system-search-symbolic", validators.iconName)
            }
        },

        bar: {
            background: option("#000000BF", validators.color),
            icon_color: option("#5D93B0FF", validators.color),
            layout: {
                outer_gap: option(8, validators.number),
                gap: option(6, validators.number),
                left: option(
                    [
                        { name: "WorkspaceSelector", props: { scroll_direction: "normal" } }
                    ] as TBarLayout,
                    validators.barWidgets
                ),
                center: option(
                    [
                        
                    ] as TBarLayout,
                    validators.barWidgets
                ),
                right: option(
                    [

                    ] as TBarLayout,
                    validators.barWidgets
                )
            }
        }
    };
}; 