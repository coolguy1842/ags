import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { ClockFormatValidator } from "src/options/validators/clockFormatValidator";

const defaultProps = {
    format: "%a %b %d, %H:%M:%S"
};

type PropsType = typeof defaultProps;
export class Clock extends BarWidget<PropsType> {
    constructor() { super("Clock", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        const newProps = Object.assign({}, props) as PropsType;
        newProps.format = ClockFormatValidator.create().validate(newProps.format, fallback.format) ?? fallback.format;
    
        return newProps;
    }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Box({
            className: "bar-widget-clock",
            child: Widget.Label({
                label: globals.clock?.bind().transform(x => x.format(props.format) ?? "")
            })
        });
    }
};