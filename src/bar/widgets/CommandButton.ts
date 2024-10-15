import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { IconNameValidator } from "src/options/validators/iconNameValidator";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { icon } from "src/utils/utils";

const defaultProps = {
    display: {
        icon: undefined as { name: string, size: number } | undefined,
        text: "button" as string | undefined
    },
    command: ``
};

type PropsType = typeof defaultProps;
export class CommandButton extends BarWidget<PropsType> {
    constructor() { super("CommandButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        const icon = {
            name: IconNameValidator.create().validate(props.display.icon?.name ?? "", fallback.display.icon?.name),
            size: NumberValidator.create({ min: 1 }).validate(props.display.icon?.size ?? 0, fallback.display.icon?.size),
        };

        return {
            display: {
                icon: (icon.name == undefined || icon.size == undefined) ? undefined : icon as { name: string, size: number },
                text: props.display.text ? StringValidator.create().validate(props.display.text, fallback.display.text) ?? fallback.display.text : undefined
            },

            command: StringValidator.create().validate(props.command, fallback.command) ?? fallback.command
        };
    }

    create(_monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-button" ],
            onClicked: async() => {
                Utils.execAsync(props.command);
            },
            setup: (self) => {
                const hasIcon = props.display.icon != undefined;
                const hasText = props.display.text != undefined;

                if(hasIcon) {
                    self.child = Widget.Icon({
                        size: props.display.icon?.size,
                        setup: (self) => {
                            const { bar } = globals.optionsHandler!.options;
        
                            const loadIcon = () => self.icon = this.loadPixbuf(props.display.icon!.name);
                            loadIcon();
        
                            self.hook(bar.icon_color, loadIcon);
                        }
                    });
                }

                if(hasText) {
                    self.label = props.display.text!;
                }
            }
        });
    }
};