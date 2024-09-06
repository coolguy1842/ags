import { Monitor } from "types/service/hyprland";
import { getBarComponents } from "./components/components";
import { globals } from "src/globals";

export function Bar(monitor: Monitor) {
    const layout = globals.optionsHandler.options.bar.layout;

    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.name}`,
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
                children: layout.left.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            }),
            centerWidget: Widget.Box({
                hpack: "center",
                hexpand: true,
                spacing: layout.gap.bind(),
                children: layout.center.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            }),
            endWidget: Widget.Box({
                css: layout.outer_gap.bind().as(gap => {
                    return `margin-right: ${gap}px;`;
                }),
                hpack: "end",
                vpack: "center",
                hexpand: true,
                spacing: layout.gap.bind(),
                children: layout.right.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            })
        })
    });

    return window;
}