import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { ValueInEnumValidator } from "src/options/validators/valueInEnumValidator";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { arraysEqual, icon } from "src/utils/utils";

import GdkPixbuf from "gi://GdkPixbuf";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { Workspace } from "types/service/hyprland";

const hyprland = await Service.import("hyprland");
export enum ScrollDirection {
    INVERTED = "inverted",
    NORMAL = "normal"
};

const defaultProps = {
    scroll_direction: ScrollDirection.NORMAL,
    spacing: 1,
    icon_size: 8
};


type PropsType = typeof defaultProps;
export class WorkspaceSelector extends BarWidget<PropsType> {
    constructor() { super("WorkspaceSelector", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            scroll_direction: ValueInEnumValidator.create(ScrollDirection).validate(props.scroll_direction) ?? fallback.scroll_direction,
            spacing: NumberValidator.create({ min: 0 }).validate(props.spacing) ?? fallback.spacing,
            icon_size: NumberValidator.create({ min: 1 }).validate(props.icon_size) ?? fallback.icon_size,
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.EventBox({
            class_name: "bar-widget-workspace-selector",
            child: Widget.Box({
                spacing: props.spacing,
                setup: (self) => {
                    var prevWorkspaces: number[] = [];
                    const updateChildren = () => {
                        const workspaces = hyprland.workspaces
                            .filter(x => x.monitor == monitor.plugname && !x.name.startsWith("special"))
                            .sort((a, b) => a.id - b.id);

                        const workspaceIDs = workspaces.map(x => x.id);

                        if(arraysEqual(prevWorkspaces, workspaceIDs)) return;
                        self.children = workspaces.map(x => this._createWorkspaceButton(monitor, x.id, props.icon_size))

                        prevWorkspaces = workspaceIDs;
                    }

                    updateChildren();
                    self.hook(hyprland, updateChildren);
                }
            }),
            onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "-" : "+"}1`),
            onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "+" : "-"}1`)
        });
    }


    private _createWorkspaceButton(monitor: TBarWidgetMonitor, workspaceID: number, iconSize: number) {
        return Widget.Button({
            classNames: [ "bar-widget-workspace-selector-button", "bar-button" ],
            child: Widget.Icon({
                size: iconSize,
                setup: (self) => {
                    const { bar, icons } = globals.optionsHandler!.options;

                    const loadIcon = () => {
                        const active = hyprland.monitors.find(x => x.name == monitor.plugname)?.activeWorkspace.id == workspaceID;
                        self.icon = active ? this.loadPixbuf(icons.bar.workspace_dot_filled.value) : this.loadPixbuf(icons.bar.workspace_dot.value);
                    }

                    loadIcon();
                    
                    self.hook(hyprland, loadIcon);
                    self.hook(bar.icon_color, loadIcon);

                    self.hook(icons.bar.workspace_dot, loadIcon);
                    self.hook(icons.bar.workspace_dot_filled, loadIcon);
                }
            }),
            onClicked: () => hyprland.messageAsync(`dispatch workspace ${workspaceID}`),
        });
    }
};