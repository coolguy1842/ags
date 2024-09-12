import { Monitor } from "types/service/hyprland";
import { globals } from "src/globals";
import { WorkspaceSelector } from "./widgets/workspaceSelector";
import { Clock } from "./widgets/clock";
import { TBarWidgetMonitor } from "src/interfaces/barWidget";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock()
};

export function Bar(monitor: TBarWidgetMonitor) {
    const layout = globals.optionsHandler.options.bar.layout;

    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.plugname}`,
        class_name: "bar",
        anchor: [ "bottom", "left", "right" ],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            height_request: 32,
            startWidget: Widget.Box({
                css: layout.outer_gap.bind().as(gap => {
                    return `margin-left: ${gap}px;`;
                }),
                hexpand: true,
                spacing: layout.gap.bind(),
                children: layout.left.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            centerWidget: Widget.Box({
                hpack: "center",
                hexpand: true,
                spacing: layout.gap.bind(),
                children: layout.center.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            endWidget: Widget.Box({
                css: layout.outer_gap.bind().as(gap => {
                    return `margin-right: ${gap}px;`;
                }),
                hpack: "end",
                vpack: "center",
                hexpand: true,
                spacing: layout.gap.bind(),
                children: layout.right.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            })
        })
    });

    return window;
}