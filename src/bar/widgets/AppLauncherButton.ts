import Gdk30 from "gi://Gdk";
import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { IconNameValidator } from "src/options/validators/iconNameValidator";
import { toggleAppLauncherPopupWindow } from "src/popups/AppLauncherPopupWindow";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { icon } from "src/utils/utils";

const defaultProps = {
    launcher_icon: "emblem-archlinux-symbolic"
};

type PropsType = typeof defaultProps;
export class AppLauncherButton extends BarWidget<PropsType> {
    constructor() { super("AppLauncherButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            launcher_icon: IconNameValidator.create().validate(props.launcher_icon, fallback.launcher_icon) ?? fallback.launcher_icon
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        const { bar } = globals.optionsHandler!.options;
        
        return Widget.Box({
            classNames: [ "bar-widget-app-launcher-button" ],
            child: Widget.Button({
                classNames: [ "bar-button" ],
                child: Widget.Icon({
                    icon: bar.icon_color.bind().transform(x => {
                        return icon(props.launcher_icon).load_symbolic(HEXtoGdkRGBA(x), null, null, null)[0];
                    }) 
                }),
                onClicked: () => {
                    toggleAppLauncherPopupWindow(monitor.id);
                }
            })
        });
    }
};