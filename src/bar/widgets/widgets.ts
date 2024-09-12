import { Clock } from "./clock";
import { SystemTray } from "./systemTray";
import { WorkspaceSelector } from "./workspaceSelector";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    SystemTray: new SystemTray()
};