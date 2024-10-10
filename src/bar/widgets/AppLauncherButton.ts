import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options/validators/stringValidator";
import { toggleAppLauncherPopupWindow } from "src/popups/AppLauncherPopupWindow";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";

const defaultProps = {
    launcher_icon: "󰣇 "
};

type PropsType = typeof defaultProps;
export class AppLauncherButton extends BarWidget<PropsType> {
    constructor() { super("AppLauncherButton", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            launcher_icon: StringValidator.create().validate(props.launcher_icon, fallback.launcher_icon) ?? fallback.launcher_icon
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Box({
            child: Widget.Button({
                classNames: [ "bar-widget-app-launcher-button", "bar-button" ],
                label: props.launcher_icon,
                onClicked: () => {
                    toggleAppLauncherPopupWindow(monitor.id);
                }
            })
        });
    }
};