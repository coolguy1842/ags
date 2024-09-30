import { BarWidgets } from "./bar/widgets/widgets";
import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";

type TBarLayoutItem<T extends keyof (typeof BarWidgets)> = {
    name: T,
    props: (typeof BarWidgets)[T]["defaultProps"]
};

type TBarLayout = TBarLayoutItem<keyof (typeof BarWidgets)>[];

// TODO: add options for min and max range of number
export class NumberValidator<T extends number> implements OptionValidator<T> {
    private _min?: number;
    private _max?: number;

    constructor(options?: {
        min?: number,
        max?: number
    }) {
        this._min = options?.min;
        this._max = options?.max;
    }

    validate(value: T, previousValue?: T) {
        if(isNaN(value)) return undefined;

        if(this._min && value < this._min) return this._min as T;
        if(this._max && value > this._max) return this._max as T;

        return value;
    }
};

export class BooleanValidator<T extends boolean> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        return typeof value == "boolean" ? value : undefined;
    }
};

// TODO: add options for length of the color (e.g 4 byte or 3 byte hex)
enum HEXColorType {
    RGB,
    RGBA
};

export class HEXColorValidator<T extends string> implements OptionValidator<T> {
    private _colorType: HEXColorType;
    
    constructor(colorType: HEXColorType = HEXColorType.RGBA) {
        this._colorType = colorType;
    }

    validate(value: T, previousValue?: T) {
        switch(this._colorType) {
        case HEXColorType.RGB:
            return /^#[0-9A-F]{6}$/.test(value) ? value : undefined;
        case HEXColorType.RGBA:
            return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
        default: return undefined;
        }
    }
};

export class BarLayoutValidator<T extends TBarLayout> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        if(value == undefined || !Array.isArray(value)) {
            return undefined;
        }

        for(const key in value) {
            const val = value[key];
            const previousVal = previousValue ? previousValue[key] : undefined;

            if(!(val.name in BarWidgets)) {
                return undefined;
            }

            const component = BarWidgets[val.name];
            const props = component.propsValidator(val.props as any, previousVal?.props as any);
            val.props = props ?? component.defaultProps;
        }

        return value;
    }
};

export class StringValidator<T extends string> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        if(value == undefined) return undefined;
        return typeof value == "string" ? value : undefined;
    }
};

export class StringArrayValidator<T extends string[]> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        if(value == undefined || !Array.isArray(value)) return undefined;
        return value.every(x => typeof x == "string") ? value : undefined;
    }
};

export class IconNameValidator<T extends string> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        if(typeof value != "string") return undefined;
        return Utils.lookUpIcon(value) ? value : undefined;
    }
};

type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };
export class ValueInEnumValidator<E extends Enum<E>, Key extends keyof E> implements OptionValidator<E[Key]> {
    private _enumValue: E;

    constructor(enumValue: E) {
        this._enumValue = enumValue;
    }

    validate(value: E[Key], previousValue?: E[Key]) {
        if(Object.values(this._enumValue).includes(value as any)) {
            return value; 
        }

        return undefined;
    }
};



export enum BarPosition {
    TOP = "top",
    BOTTOM = "bottom"
};

export interface IOptions extends TOptions {
    icons: {
        app_launcher: {
            search: Option<string>
        }
    },

    bar: {
        position: Option<BarPosition>;
        height: Option<number>;

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

    system_tray: {
        background: Option<string>;
        favorites: Option<string[]>;

        icon_size: Option<number>;

        padding: Option<number>;
        border_radius: Option<number>;
    };

    app_launcher: {
        background: Option<string>;
        padding: Option<number>;
        border_radius: Option<number>;

        search: {
            background: Option<string>;
            border_radius: Option<number>;
        }

        application: {
            background: Option<string>;
            background_selected: Option<string>;

            padding: Option<number>;
            border_radius: Option<number>;
        }

        spacing: Option<number>;
        icon_size: Option<number>;

        rows: Option<number>;
        columns: Option<number>;
    };
};

export function getOptions(): IOptions {
    return {
        icons: {
            app_launcher: {
                search: option("system-search-symbolic", new IconNameValidator())
            }
        },

        bar: {
            position: option(BarPosition.BOTTOM, new ValueInEnumValidator(BarPosition)),
            height: option(32, new NumberValidator({ min: 12, max: 60 })),

            background: option("#000000BF", new HEXColorValidator()),
            icon_color: option("#5D93B0FF", new HEXColorValidator()),

            layout: {
                outer_gap: option(8, new NumberValidator()),
                gap: option(6, new NumberValidator()),
                left: option(
                    [
                        { name: "AppLauncherButton" },
                        { name: "WorkspaceSelector" }
                    ] as TBarLayout,
                    new BarLayoutValidator()
                ),
                center: option(
                    [
                        { name: "Clock" }
                    ] as TBarLayout,
                    new BarLayoutValidator()
                ),
                right: option(
                    [
                        { name: "ColorPickerButton" },
                        { name: "ScreenshotButton" },
                        { name: "SystemTray" }
                    ] as TBarLayout,
                    new BarLayoutValidator()
                )
            },
        },
        system_tray: {
            background: option("#000000BF", new HEXColorValidator()),
            favorites: option([] as string[], new StringArrayValidator()),

            icon_size: option(14, new NumberValidator({ min: 1, max: 30 })),

            padding: option(8, new NumberValidator({ min: 0, max: 30 })),
            border_radius: option(12, new NumberValidator({ min: 0, max: 50 }))
        },
        app_launcher: {
            background: option("#000000BF", new HEXColorValidator()),
            padding: option(12, new NumberValidator({ min: 0, max: 32 })),
            border_radius: option(12, new NumberValidator({ min: 0, max: 50 })),

            search: {
                background: option("#141414FF", new HEXColorValidator()),
                border_radius: option(12, new NumberValidator({ min: 0, max: 50 })),
            },

            application: {
                background: option("#00000000", new HEXColorValidator()),
                background_selected: option("#484848FF", new HEXColorValidator()),

                padding: option(4, new NumberValidator({ min: 0, max: 64 })),
                border_radius: option(8, new NumberValidator({ min: 0, max: 50 }))
            },

            spacing: option(4, new NumberValidator({ min: 0, max: 50 })),
            icon_size: option(32, new NumberValidator({ min: 1, max: 80 })),

            rows: option(4, new NumberValidator({ min: 1, max: 15 })),
            columns: option(5, new NumberValidator({ min: 1, max: 15 }))
        }
    };
}; 