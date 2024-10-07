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
                hpack: "start",
                vpack: "center",
                hexpand: true,
                children: [
                    BarWidgets.WorkspaceSelector.create(monitor, { scroll_direction: ScrollDirection.NORMAL })
                ]
            }),
            centerWidget: Widget.Box({
                hpack: "center",
                vpack: "center",
                hexpand: true,
            }),
            endWidget: Widget.Box({
                hpack: "end",
                vpack: "center",
                hexpand: true,
            })
        })
    }).hook(bar.position, (self) => {
        self.anchor = [ bar.position.value, "left", "right" ];
    }).hook(bar.height, (self) => {
        self.height_request = bar.height.value;
    });

    return window;
}