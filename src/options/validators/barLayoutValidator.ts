import { BarWidgets } from "src/bar/widgets/widgets";
import { OptionValidator } from "src/utils/handlers/optionsHandler";

export type TBarLayoutItem<T extends keyof (typeof BarWidgets)> = {
    name: T,
    props: (typeof BarWidgets)[T]["defaultProps"]
};

export type TBarLayout = TBarLayoutItem<keyof (typeof BarWidgets)>[];

type TOptions = {};
export class BarLayoutValidator<T extends TBarLayout> implements OptionValidator<T> {
    private _options?: TOptions;
    private constructor(options?: TOptions) {
        this._options = options;
    }

    static create() {
        return new BarLayoutValidator({});
    }


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
