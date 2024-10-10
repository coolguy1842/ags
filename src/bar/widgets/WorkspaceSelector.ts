import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { StringValidator } from "src/options/validators/stringValidator";
import { ValueInEnumValidator } from "src/options/validators/valueInEnumValidator";

const hyprland = await Service.import("hyprland");
export enum ScrollDirection {
    INVERTED = "inverted",
    NORMAL = "normal"
};

const defaultProps = {
    scroll_direction: ScrollDirection.NORMAL,
    spacing: 0,

    activeSymbol: "",
    inActiveSymbol: ""
};

type PropsType = typeof defaultProps;
export class WorkspaceSelector extends BarWidget<PropsType> {
    constructor() { super("WorkspaceSelector", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            scroll_direction: ValueInEnumValidator.create(ScrollDirection).validate(props.scroll_direction) ?? fallback.scroll_direction,
            spacing: NumberValidator.create({ min: 0 }).validate(props.spacing) ?? fallback.spacing,
            
            activeSymbol: StringValidator.create().validate(props.activeSymbol, fallback.activeSymbol) ?? fallback.activeSymbol,
            inActiveSymbol: StringValidator.create().validate(props.inActiveSymbol, fallback.inActiveSymbol) ?? fallback.inActiveSymbol
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-widget-workspace-selector",
            child: Widget.Box({
                spacing: props.spacing,
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