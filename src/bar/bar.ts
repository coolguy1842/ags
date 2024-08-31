import { Monitor } from "types/service/hyprland";
import { WorkspaceSelector } from "./components/workspaceSelector";

export function Bar(monitor: Monitor) {
    return Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.name}`,
        anchor: [ "bottom", "left", "right" ],
        exclusivity: "exclusive",
        child: Widget.Box({
            class_name: "bar",
            height_request: 32,
            children: [
                WorkspaceSelector(monitor.name)
            ]
        })
    });
}