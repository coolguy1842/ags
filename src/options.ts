import { getBarWidgets, TBarWidgets } from "./bar/widgets/widgets";
import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";
import GLib from "gi://GLib?version=2.0";

type TBarLayoutItem<T extends keyof TBarWidgets> = {
    name: T,
    props: TBarWidgets[T]["props"]
};

type TBarLayout = TBarLayoutItem<keyof TBarWidgets>[];

function getOptionValidators(): { [key: string]: OptionValidator<any> } {
    return {
        number: {
            validate: (value: number) => {
                return isNaN(value) ? undefined : value;
            }
        },
        colour: {
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
        },
        quick_menu_button: {
            background: Option<string>;
            side_padding: Option<number>;
            border_radius: Option<number>
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
                        { name: "QuickMenuButton", props: {} }
                    ] as TBarLayout,
                    validators.barWidgets
                )
            },
            quick_menu_button: {
                background: option("#BDA4A419", validators.colour),
                side_padding: option(6, validators.number),
                border_radius: option(4, validators.number)
            }
        },
    };
}; 