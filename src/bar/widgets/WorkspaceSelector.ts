import { basicBarWidgetPropsValidator, IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { ValueInEnumValidator } from "src/options/validators/valueInEnumValidator";

//#region PROPS

export enum ScrollDirection {
    INVERTED = "inverted",
    NORMAL = "normal"
};

const defaultProps = { scroll_direction: ScrollDirection.NORMAL };
type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps {
    const newProps = Object.assign({}, props) as TProps;
    newProps.scroll_direction = ValueInEnumValidator.create(ScrollDirection).validate(newProps.scroll_direction) ?? fallback.scroll_direction;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps);
    return _validateProps(basicBarWidgetPropsValidator(props, fallback), fallback);
}

//#endregion

const hyprland = await Service.import("hyprland");
export class WorkspaceSelector implements IBarWidget<PropsType> {
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
            className: "bar-workspace-selector-button",
            label: inactiveSymbol,
            onClicked: () => hyprland.messageAsync(`dispatch workspace ${workspaceID}`),
        }).hook(hyprland, (self) => {
            self.label = hyprland.monitors.find(x => x.name == monitor.plugname)?.activeWorkspace.id == workspaceID ? activeSymbol : inactiveSymbol;
        });
    }
};