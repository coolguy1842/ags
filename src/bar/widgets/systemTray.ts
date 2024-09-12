import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import Gtk from "gi://Gtk?version=3.0";

//#region PROPS

const defaultProps = {};
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

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class SystemTray implements IBarWidget<PropsType, Gtk.EventBox> {
    name = "SystemTray";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-system-tray",
            child: Widget.Box({
                children: [
                    Widget.Label("test")
                ]
            })
        }); 
    }
};