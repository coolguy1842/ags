import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { toggleQuickMenuPopup } from "src/popups/QuickMenuPopupWindow";

const defaultProps = {
    power_icon: " 󰐥 ",

    horizontal_padding: 6,
    vertical_padding: 2
};

type PropsType = typeof defaultProps;
export class QuickMenu extends BarWidget<PropsType> {
    constructor() { super("QuickMenu", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            power_icon: StringValidator.create().validate(props.power_icon, fallback.power_icon) ?? fallback.power_icon,

            horizontal_padding: NumberValidator.create({ min: 0 }).validate(props.horizontal_padding) ?? fallback.horizontal_padding,
            vertical_padding: NumberValidator.create({ min: 0 }).validate(props.vertical_padding) ?? fallback.vertical_padding
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-widget-quick-menu" ],
            css: `padding: ${props.vertical_padding}px ${props.horizontal_padding}px`,
            onClicked: (self) => {
                toggleQuickMenuPopup(monitor.id, self);
            },
            child: Widget.Label({
                label: props.power_icon
            })
        });
    }
};