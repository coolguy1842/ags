import { IComponent } from "src/interfaces/IComponent";
import { WorkspaceButton } from "../widgets/workspaceButton";

const hyprland = await Service.import("hyprland");

export function getWorkspaceSelector(): IComponent {
    return {
        name: "WorkspaceSelector",
        create(monitor) {
            return Widget.EventBox({
                class_name: "bar-workspace-selector",
                child: Widget.Box({
                    children: hyprland.bind("workspaces").transform(workspaces => workspaces.filter(x => x.monitor == monitor && !x.name.startsWith("special"))).as(workspaces => {
                        return workspaces.map(x => WorkspaceButton(monitor, x.id));
                    })
                }),
                onScrollDown: () => hyprland.messageAsync("dispatch workspace m-1"),
                onScrollUp: () => hyprland.messageAsync("dispatch workspace m+1")
            }); 
        }
    };
}