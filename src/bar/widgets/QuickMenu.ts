import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { toggleQuickMenuPopup } from "src/popups/QuickMenuPopupWindow";

const defaultProps = {
    icon_size: 12,

    horizontal_padding: 6,
    vertical_padding: 2
};

type PropsType = typeof defaultProps;
export class QuickMenu extends BarWidget<PropsType> {
    constructor() { super("QuickMenu", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            icon_size: NumberValidator.create({ min: 1 }).validate(props.icon_size, fallback.icon_size) ?? fallback.icon_size,

            horizontal_padding: NumberValidator.create({ min: 0 }).validate(props.horizontal_padding, fallback.icon_size) ?? fallback.horizontal_padding,
            vertical_padding: NumberValidator.create({ min: 0 }).validate(props.vertical_padding, fallback.icon_size) ?? fallback.vertical_padding
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const { icons, bar } = globals.optionsHandler!.options;
        return Widget.Button({
            classNames: [ "bar-widget-quick-menu" ],
            css: `padding: ${props.vertical_padding}px ${props.horizontal_padding}px`,
            onClicked: (self) => {
                toggleQuickMenuPopup(monitor.id, self);
            },
            child: Widget.Icon({
                size: props.icon_size,
                setup: (self) => {
                    const loadIcon = () => self.icon = this.loadPixbuf(icons.bar.power.value);
                    
                    loadIcon();
                    self.hook(icons.bar.power, loadIcon);
                    self.hook(bar.icon_color, loadIcon);
                }
            })
        });
    }
};