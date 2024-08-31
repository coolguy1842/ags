const activeSymbol = ``;
const inactiveSymbol = ``;

const hyprland = await Service.import("hyprland");

export function WorkspaceButton(monitorName: string, workspaceID: number) {
    // const monitor = hyprland.monitors.find(x => x.name == monitorName)!;

    return Widget.Button({
        class_name: "bar-workspace-button",
        label: hyprland.bind("monitors").transform(monitors => monitors.find(x => x.name == monitorName)).transform(x => x?.activeWorkspace.id == workspaceID ? activeSymbol : inactiveSymbol)
    });
}