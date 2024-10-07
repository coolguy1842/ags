import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { ValueInEnumValidator } from "src/options";

import Gtk from "gi://Gtk?version=3.0";

const hyprland = await Service.import("hyprland");

//#region PROPS

enum ScrollDirection {
    INVERTED = "inverted",
    NORMAL = "normal"
};
const defaultProps = {
    scroll_direction: ScrollDirection.NORMAL
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

    newProps.scroll_direction = new ValueInEnumValidator(ScrollDirection).validate(newProps.scroll_direction) ?? fallback.scroll_direction;
    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

export class WorkspaceSelector implements IBarWidget<PropsType, Gtk.EventBox> {
    name = "WorkspaceSelector";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-workspace-selector",
            child: Widget.Box({
                children: hyprland.bind("workspaces")
                    .transform(workspaces => workspaces
                        .filter(x => x.monitor == monitor.plugname && !x.name.startsWith("special"))
                        .sort((a, b) => a.id - b.id)
                        .map(x => this._createWorkspaceButton(monitor, x.id))
                    )
            }),
            onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "-" : "+"}1`),
            onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "+" : "-"}1`)
        }); 
    }

    private _createWorkspaceButton(monitor: TBarWidgetMonitor, workspaceID: number) {
        const activeSymbol = ``;
        const inactiveSymbol = ``;
        
        return Widget.Button({
            className: "bar-workspace-button",
            label: inactiveSymbol,
            onClicked: () => hyprland.messageAsync(`dispatch workspace ${workspaceID}`),
        }).hook(hyprland, (self) => {
            self.label = hyprland.monitors.find(x => x.name == monitor.plugname)?.activeWorkspace.id == workspaceID ? activeSymbol : inactiveSymbol;
        });
    }
};