import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options/validators/stringValidator";

const defaultProps = {
    power_icon: "󰐥 "
};

type PropsType = typeof defaultProps;
export class QuickMenu extends BarWidget<PropsType> {
    constructor() { super("QuickMenu", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            power_icon: StringValidator.create().validate(props.power_icon, fallback.power_icon) ?? fallback.power_icon
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Box({
            classNames: [ "bar-widget-quick-menu" ],
            child: Widget.Button({
                classNames: [ "bar-button" ],
                label: props.power_icon,
                onClicked: () => {

                }
            })
        });
    }
};