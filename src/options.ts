import { value_type_get_localized_name } from "types/@girs/atk-1.0/atk-1.0.cjs";
import { getBarWidgets } from "./bar/widgets/widgets";
import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import GLib from "gi://GLib?version=2.0";

type TBarLayoutItem<T extends keyof ReturnType<typeof getBarWidgets>> = {
    name: T,
    props: ReturnType<typeof getBarWidgets>[T]["props"]
};

type TBarLayout = TBarLayoutItem<keyof ReturnType<typeof getBarWidgets>>[];

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
                    if(!(val.name in getBarWidgets())) {
                        return undefined;
                    }

                    const component = getBarWidgets()[val.name];
                    if(val.props == undefined) {
                        val.props = component.props;
                    }

                    for(const key in component.props) {
                        if(!(key in val.props)) {
                            val.props[key] = component.props[key];
                        }
                    }

                    for(const key in val.props) {
                        if(!(key in component.props)) {
                            delete val.props[key];
                        }
                    }
                }

                return value;
            }
        },
        stringArray: {
            validate: (value: string[]) => {
                if(value == undefined || !Array.isArray(value)) return undefined;
                return value.every(x => typeof x == "string") ? value : undefined;
            }
        }
    };
}

export interface IOptions extends TOptions {
    bar: {
        background_color: Option<string>;
        icon_color: Option<string>;

        layout: {
            outer_gap: Option<number>;
            gap: Option<number>;
            left: Option<TBarLayout>;
            center: Option<TBarLayout>;
            right: Option<TBarLayout>;
        };

        system_tray: {
            background: Option<string>;
            side_padding: Option<number>;
            border_radius: Option<number>;
            spacing: Option<number>;
        };
        
        quick_menu: {
            background: Option<string>;
            side_padding: Option<number>;
            border_radius: Option<number>;
            spacing: Option<number>;
        };
    };

    system_tray: {
        animation: {
            enabled: Option<boolean>;

            duration: Option<number>;
            reverse_duration: Option<number>;

            update_rate: Option<number>;
        }

        background: Option<string>;
        border_radius: Option<number>;
        padding: Option<number>;
        spacing: Option<number>;

        favorites: Option<string[]>;
    };
};

export function getOptions(): IOptions {
    const validators = getOptionValidators();

    return {
        bar: {
            background_color: option("#000000E0", validators.color),
            icon_color: option("#5D93B0FF", validators.color),
            layout: {
                outer_gap: option(8, validators.number),
                gap: option(6, validators.number),
                left: option(
                    [
                        { name: "AppLauncherButton", props: { test: "" } },
                        { name: "WorkspaceSelector", props: {} }
                    ] as TBarLayout,
                    validators.barWidgets
                ),
                center: option(
                    [
                        { name: "TimeAndNotificationsDisplay", props: {} }
                    ] as TBarLayout,
                    validators.barWidgets
                ),
                right: option(
                    [
                        { name: "ColorPickerButton", props: getBarWidgets().ColorPickerButton.props },
                        { name: "ScreenshotButton", props: getBarWidgets().ScreenshotButton.props },
                        { name: "SystemTray", props: {} },
                        { name: "QuickMenuButton", props: {} }
                    ] as TBarLayout,
                    validators.barWidgets
                )
            },
            system_tray: {
                background: option("#BDA4A419", validators.color),
                side_padding: option(6, validators.number),
                border_radius: option(4, validators.number),
                spacing: option(8, validators.number)
            },
            quick_menu: {
                background: option("#BDA4A419", validators.color),
                side_padding: option(6, validators.number),
                border_radius: option(4, validators.number),
                spacing: option(8, validators.number)
            }
        },
        system_tray: {
            animation: {
                enabled: option(true, validators.boolean),

                duration: option(0.2, validators.number),
                reverse_duration: option(0.15, validators.number),

                update_rate: option(100, validators.number)
            },

            background: option('#000000E0', validators.color),
            border_radius: option(8, validators.number),
            padding: option(8, validators.number),
            spacing: option(8, validators.number),
            
            favorites: option([], validators.stringArray)
        }
    };
}; 