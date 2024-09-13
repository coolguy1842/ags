import { BarWidgets } from "./bar/widgets/widgets";
import { option, Option, OptionValidator, TOptions } from "./utils/handlers/optionsHandler";

type TBarLayoutItem<T extends keyof (typeof BarWidgets)> = {
    name: T,
    props: (typeof BarWidgets)[T]["defaultProps"]
};

type TBarLayout = TBarLayoutItem<keyof (typeof BarWidgets)>[];

// TODO: add options for min and max range of number
export class NumberValidator<T extends number> implements OptionValidator<T> {
    private _min?: T;
    private _max?: T;

    constructor(options?: {
        min?: T,
        max?: T
    }) {
        this._min = options?.min;
        this._max = options?.max;
    }

    validate(value: T, previousValue?: T) {
        if(isNaN(value)) return undefined;

        if(this._min && value < this._min) return this._min;
        if(this._max && value > this._max) return this._max;

        return value;
    }
};

export class BooleanValidator<T extends boolean> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        return typeof value == "boolean" ? value : undefined;
    }
};

// TODO: add options for length of the color (e.g 4 byte or 3 byte hex)
export class HEXColorValidator<T extends string> implements OptionValidator<T> {
    validate(value: T, previousValue?: T) {
        return /^#[0-9A-F]{8}$/.test(value) ? value : undefined;
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

        tray_favorites: Option<string[]>
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
                        { name: "WorkspaceSelector", props: { scroll_direction: "normal" } }
                    ] as TBarLayout,
                    new BarLayoutValidator()
                ),
                center: option(
                    [
                        
                    ] as TBarLayout,
                    new BarLayoutValidator()
                ),
                right: option(
                    [
                        { name: "SystemTray", props: {} }
                    ] as TBarLayout,
                    new BarLayoutValidator()
                )
            },

            tray_favorites: option([] as string[], new StringArrayValidator())
        }
    };
}; 