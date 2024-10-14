import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { icon } from "src/utils/utils";

const defaultProps = {
    color_pick_command: `bash -c 'hyprpicker -r --format=hex -a'`,
    icon_size: 14
};

type PropsType = typeof defaultProps;
export class ColorPickerButton extends BarWidget<PropsType> {
    private loadPixbuf(name: string) {
        const { bar } = globals.optionsHandler!.options;
        return icon(name).load_symbolic(HEXtoGdkRGBA(bar.icon_color.value), null, null, null)[0];
    }

    constructor() { super("ColorPickerButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            color_pick_command: StringValidator.create().validate(props.color_pick_command, fallback.color_pick_command) ?? fallback.color_pick_command,
            icon_size: NumberValidator.create({ min: 1 }).validate(props.icon_size, fallback.icon_size) ?? fallback.icon_size
        };
    }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-widget-color-picker-button", "bar-button" ],
            child: Widget.Icon({
                size: props.icon_size,
                setup: (self) => {
                    const { bar, icons } = globals.optionsHandler!.options;

                    const loadIcon = () => self.icon = this.loadPixbuf(icons.bar.color_picker.value);
                    loadIcon();

                    self.hook(bar.icon_color, loadIcon);
                    self.hook(icons.bar.color_picker, loadIcon);
                    self.hook(bar.icon_color, loadIcon);
                }
            }),
            onClicked: async() => {
                Utils.execAsync(props.color_pick_command);
            }
        });
    }
};