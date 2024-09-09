import { WorkspaceButton } from "../components/workspaceButton";

const hyprland = await Service.import("hyprland");

type ScrollDirection = "inverted" | "normal";

export function getWorkspaceSelector() {
    const defaultProps: {
        scroll_direction: ScrollDirection
    } = {
        scroll_direction: "normal"
    };

    return {
        name: "WorkspaceSelector",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.EventBox({
                class_name: "bar-workspace-selector",
                child: Widget.Box({
                    children: hyprland.bind("workspaces")
                        .transform(workspaces => 
                            workspaces
                                .filter(x => x.monitor == monitor && !x.name.startsWith("special"))
                                .sort((a, b) => a.id - b.id)
                        )
                        .as(workspaces => {
                            return workspaces.map(x => WorkspaceButton(monitor, x.id));
                        })
                }),
                onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "normal" ? "-" : "+"}1`),
                onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "normal" ? "+" : "-"}1`)
            }); 
        }
    };
}