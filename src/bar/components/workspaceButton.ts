import { Workspace } from "types/service/hyprland";

const activeSymbol = ``;
const inactiveSymbol = ``;

const hyprland = await Service.import("hyprland");



export function WorkspaceButton(monitorName: string, workspaceID: number) {
    return Widget.Button({
        class_name: "bar-workspace-button",
        label: inactiveSymbol,
        onClicked: () => {
            hyprland.messageAsync(`dispatch workspace ${workspaceID}`)
        },
    }).hook(hyprland, (self) => {
        self.label = hyprland.monitors.find(x => x.name == monitorName)?.activeWorkspace.id == workspaceID ? activeSymbol : inactiveSymbol;
    });
}