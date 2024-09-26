import { globals } from "src/globals";
import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { DerivedVariable } from "src/utils/utils";

import Gtk from "gi://Gtk?version=3.0";
import { StringValidator } from "src/options";

//#region PROPS

const defaultProps = {
    icon: "󰣇 "
};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps | undefined {
    if(props == undefined || typeof props != "object") {
        return fallback;
    }

    const newProps = Object.assign({}, props) as TProps;
    for(const key in props) {
        if(fallback[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in defaultProps) {
        if(newProps[key] == undefined) {
            newProps[key] = fallback[key];
        }
    }

    props.icon = new StringValidator().validate(props.icon, fallback.icon) ?? fallback.icon;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class AppLauncherButton implements IBarWidget<PropsType, Gtk.Button> {
    name = "AppLauncherButton";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            class_name: "bar-app-launcher-button",
            label: props.icon,
            onClicked: (self) => {
                const AppLauncherPopupWindow = globals.popupWindows?.AppLauncher;
                if(!AppLauncherPopupWindow) return;

                if(AppLauncherPopupWindow.window.is_visible()) {
                    AppLauncherPopupWindow.hide();

                    return;
                }                

                const endDerived = new DerivedVariable(
                    [
                        AppLauncherPopupWindow.screenBounds,
                        AppLauncherPopupWindow.childAllocation
                    ],
                    (screenBounds, childAllocation) => {
                        return {
                            x: (screenBounds.width / 2) - (childAllocation.width / 2),
                            y: screenBounds.height - 15
                        }
                    }
                );

                const startDerived = new DerivedVariable(
                    [
                        endDerived,
                        AppLauncherPopupWindow.screenBounds,
                        AppLauncherPopupWindow.childAllocation
                    ],
                    (end, screenBounds, childAllocation) => {
                        return {
                            x: end.x,
                            y: screenBounds.height + childAllocation.height
                        }
                    }
                );

                AppLauncherPopupWindow.onHide = () => {
                    if(globals.searchInput) {
                        globals.searchInput.value = "";
                    }
                    
                    startDerived.stop();
                    endDerived.stop();
                };

                AppLauncherPopupWindow.show(monitor.id, startDerived, endDerived);
            }
        });
    }
};