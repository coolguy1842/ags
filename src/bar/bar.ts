import { globals } from "src/globals";
import { TBarWidgetMonitor } from "src/interfaces/barWidget";
import { BarWidgets } from "./widgets/widgets";
import { ScrollDirection } from "./widgets/WorkspaceSelector";

export function Bar(monitor: TBarWidgetMonitor) {
    const { bar } = globals.optionsHandler!.options;

    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.id}`,
        class_name: "bar",
        anchor: [ bar.position.value, "left", "right" ],
        exclusivity: "exclusive",
        height_request: bar.height.value,
        child: Widget.CenterBox({
            startWidget: Widget.Box({
                className: "bar-left-box",
                hpack: "start",
                vpack: "center",
                hexpand: true,
                spacing: bar.widget_spacing.bind(),
                children: bar.layout.left.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            centerWidget: Widget.Box({
                className: "bar-center-box",
                hpack: "center",
                vpack: "center",
                hexpand: true,
                spacing: bar.widget_spacing.bind(),
                children: bar.layout.center.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            endWidget: Widget.Box({
                className: "bar-right-box",
                hpack: "end",
                vpack: "center",
                hexpand: true,
                spacing: bar.widget_spacing.bind(),
                children: bar.layout.right.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            })
        })
    }).hook(bar.position, (self) => {
        self.anchor = [ bar.position.value, "left", "right" ];
    }).hook(bar.height, (self) => {
        self.height_request = bar.height.value;
    });

    return window;
}