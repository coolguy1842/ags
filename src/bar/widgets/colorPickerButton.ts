import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options";

import Gtk from "gi://Gtk?version=3.0";

//#region PROPS

const defaultProps = {
    color_pick_command: `bash -c 'hyprpicker -r --format=hex -a'`
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

    newProps.color_pick_command = new StringValidator().validate(props.color_pick_command) ?? fallback.color_pick_command;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class ColorPickerButton implements IBarWidget<PropsType, Gtk.Button> {
    name = "ColorPickerButton";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            className: "bar-button",
            label: "󰈊 ",
            onClicked: () => {
                Utils.execAsync(props.color_pick_command);
            }
        });
    }
};