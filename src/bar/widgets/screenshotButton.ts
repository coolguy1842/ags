import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options";

import Gtk from "gi://Gtk?version=3.0";

//#region PROPS

const defaultProps = {
    screenshot_command: `bash -c 'grim -g "$(slurp)" - | wl-copy'`
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

    newProps.screenshot_command = new StringValidator().validate(props.screenshot_command) ?? fallback.screenshot_command;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class ScreenshotButton implements IBarWidget<PropsType, Gtk.Button> {
    name = "ScreenshotButton";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            className: "bar-button",
            label: "󰄀 ",
            onClicked: () => {
                Utils.execAsync(props.screenshot_command);
            }
        });
    }
};