import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { StringValidator } from "src/options/validators/stringValidator";
import { ValueInEnumValidator } from "src/options/validators/valueInEnumValidator";

const hyprland = await Service.import("hyprland");
export enum ScrollDirection {
    INVERTED = "inverted",
    NORMAL = "normal"
};

const defaultProps = {
    scroll_direction: ScrollDirection.NORMAL,
    activeSymbol: "",
    inActiveSymbol: ""
};

type PropsType = typeof defaultProps;
export class WorkspaceSelector extends BarWidget<PropsType> {
    constructor() { super("WorkspaceSelector", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        const newProps = Object.assign({}, props) as PropsType;
        newProps.scroll_direction = ValueInEnumValidator.create(ScrollDirection).validate(newProps.scroll_direction) ?? fallback.scroll_direction;

        newProps.activeSymbol = StringValidator.create().validate(newProps.activeSymbol, fallback.activeSymbol) ?? fallback.activeSymbol;
        newProps.inActiveSymbol = StringValidator.create().validate(newProps.inActiveSymbol, fallback.inActiveSymbol) ?? fallback.inActiveSymbol;

        return newProps;
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-widget-workspace-selector",
            child: Widget.Box({
                children: hyprland.bind("workspaces")
                    .transform(workspaces => workspaces
                        .filter(x => x.monitor == monitor.plugname && !x.name.startsWith("special"))
                        .sort((a, b) => a.id - b.id)
                        .map(x => this._createWorkspaceButton(monitor, x.id, props.activeSymbol, props.inActiveSymbol))
                    )
            }),
            onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "-" : "+"}1`),
            onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "+" : "-"}1`)
        });
    }


    private _createWorkspaceButton(monitor: TBarWidgetMonitor, workspaceID: number, activeSymbol: string, inActiveSymbol: string) {
        return Widget.Button({
            classNames: [ "bar-widget-workspace-selector-button", "bar-button" ],
            label: inActiveSymbol,
            onClicked: () => hyprland.messageAsync(`dispatch workspace ${workspaceID}`),
        }).hook(hyprland, (self) => {
            self.label = hyprland.monitors.find(x => x.name == monitor.plugname)?.activeWorkspace.id == workspaceID ? activeSymbol : inActiveSymbol;
        });
    }
};