import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options/validators/stringValidator";

const defaultProps = {
    color_pick_command: `bash -c 'hyprpicker -r --format=hex -a'`,
    icon: "󰈊 "
};

type PropsType = typeof defaultProps;
export class ColorPickerButton extends BarWidget<PropsType> {
    constructor() { super("ColorPickerButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            color_pick_command: StringValidator.create().validate(props.color_pick_command, fallback.color_pick_command) ?? fallback.color_pick_command,
            icon: StringValidator.create().validate(props.icon, fallback.icon) ?? fallback.icon
        };
    }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-widget-color-picker-button", "bar-button" ],
            label: props.icon,
            onClicked: async() => {
                Utils.execAsync(props.color_pick_command);
            }
        });
    }
};