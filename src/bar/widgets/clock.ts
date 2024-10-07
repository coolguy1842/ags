import { globals } from "src/globals";
import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import Gtk from "gi://Gtk?version=3.0";

//#region PROPS

const defaultProps = {
    clock_format: "%a %b %d, %H:%M:%S"
};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps | undefined {
    if(props == undefined || typeof props != "object") {
        return fallback;
    }

    const newProps = Object.assign({}, props) as TProps;
    for(const key in props) {
        if(fallback[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in defaultProps) {
        if(newProps[key] == undefined) {
            newProps[key] = fallback[key];
        }
    }

    const formatted = globals.clock!.value.format(newProps.clock_format);
    if(formatted == null) {
        newProps.clock_format = fallback.clock_format;
    }

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class Clock implements IBarWidget<PropsType, Gtk.Button> {
    name = "Clock";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            className: "bar-clock",
            label: globals.clock!.bind().transform(clock => clock.format(props.clock_format) ?? "")
        });
    }
};