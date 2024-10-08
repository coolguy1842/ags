import { globals } from "src/globals";
import { basicBarWidgetPropsValidator, IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { ClockFormatValidator } from "src/options/validators/clockFormatValidator";

//#region PROPS

const defaultProps = {
    format: "%a %b %d, %H:%M:%S"
};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps {
    const newProps = Object.assign({}, props) as TProps;
    newProps.format = ClockFormatValidator.create().validate(newProps.format, fallback.format) ?? fallback.format;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps);
    return _validateProps(basicBarWidgetPropsValidator(props, fallback), fallback);
}

//#endregion

export class Clock implements IBarWidget<PropsType> {
    name = "Clock";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Box({
            className: "bar-widget-clock",
            child: Widget.Label({
                label: globals.clock?.bind().transform(x => x.format(props.format) ?? "")
            })
        });
    }
};