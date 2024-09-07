const activeSymbol = ``;
const inactiveSymbol = ``;

const hyprland = await Service.import("hyprland");

export function WorkspaceButton(monitorName: string, workspaceID: number) {
    return Widget.Button({
        class_name: "bar-workspace-button",
        label: hyprland.bind("monitors").transform(monitors => monitors.find(x => x.name == monitorName)).transform(x => x?.activeWorkspace.id == workspaceID ? activeSymbol : inactiveSymbol),
        onClicked: () => {
            hyprland.messageAsync(`dispatch workspace ${workspaceID}`)
        }
    });
}