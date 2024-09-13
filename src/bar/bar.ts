import { globals } from "src/globals";
import { TBarWidgetMonitor } from "src/interfaces/barWidget";
import { BarWidgets } from "./widgets/widgets";

export function Bar(monitor: TBarWidgetMonitor) {
    const { bar } = globals.optionsHandler.options;

    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.plugname}`,
        class_name: "bar",
        anchor: [ bar.position.value, "left", "right" ],
        exclusivity: "exclusive",
        height_request: bar.height.value,
        child: Widget.CenterBox({
            startWidget: Widget.Box({
                css: bar.layout.outer_gap.bind().as(gap => {
                    return `margin-left: ${gap}px;`;
                }),
                hexpand: true,
                spacing: bar.layout.gap.bind(),
                children: bar.layout.left.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            centerWidget: Widget.Box({
                hpack: "center",
                hexpand: true,
                spacing: bar.layout.gap.bind(),
                children: bar.layout.center.bind().as(c => c.map(x => BarWidgets[x.name].create(monitor, x.props as any)))
            }),
            endWidget: Widget.Box({
                css: bar.layout.outer_gap.bind().as(gap => {
                    return `margin-right: ${gap}px;`;
                }),
                hpack: "end",
                vpack: "center",
                hexpand: true,
                spacing: bar.layout.gap.bind(),
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