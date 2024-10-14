import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options/validators/stringValidator";

const defaultProps = {
    screenshot_command: `bash -c 'grim -g "$(slurp)" - | wl-copy'`,
    icon: " 󰄀 "
};

type PropsType = typeof defaultProps;
export class ScreenshotButton extends BarWidget<PropsType> {
    constructor() { super("ScreenshotButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            screenshot_command: StringValidator.create().validate(props.screenshot_command, fallback.screenshot_command) ?? fallback.screenshot_command,
            icon: StringValidator.create().validate(props.icon, fallback.icon) ?? fallback.icon
        };
    }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-widget-screenshot-button", "bar-button" ],
            label: props.icon,
            onClicked: async() => {
                Utils.execAsync(props.screenshot_command);
            }
        });
    }
};