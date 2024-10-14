import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { toggleAppLauncherPopupWindow } from "src/popups/AppLauncherPopupWindow";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { icon } from "src/utils/utils";

const defaultProps = {
    icon_size: 16
};

type PropsType = typeof defaultProps;
export class AppLauncherButton extends BarWidget<PropsType> {
    private loadPixbuf(name: string) {
        const { bar } = globals.optionsHandler!.options;
        return icon(name).load_symbolic(HEXtoGdkRGBA(bar.icon_color.value), null, null, null)[0];
    }

    constructor() { super("AppLauncherButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            icon_size: NumberValidator.create({ min: 1 }).validate(props.icon_size, fallback.icon_size) ?? fallback.icon_size
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const { bar, icons } = globals.optionsHandler!.options;
        
        return Widget.Box({
            classNames: [ "bar-widget-app-launcher-button" ],
            child: Widget.Button({
                classNames: [ "bar-button" ],
                child: Widget.Icon({
                    size: props.icon_size,
                    setup: (self) => {
                        const updateIcon = () => {
                            self.icon = this.loadPixbuf(icons.bar.app_launcher.value);
                        }

                        updateIcon();
                        self.hook(bar.icon_color, updateIcon);
                        self.hook(icons.bar.app_launcher, updateIcon);
                    }
                }),
                onClicked: () => {
                    toggleAppLauncherPopupWindow(monitor.id);
                }
            })
        });
    }
};