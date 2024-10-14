import { AppLauncherButton } from "./AppLauncherButton";
import { Clock } from "./Clock";
import { CommandButton } from "./CommandButton";
import { QuickMenu } from "./QuickMenu";
import { SystemTray } from "./SystemTray";
import { WorkspaceSelector } from "./WorkspaceSelector";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    SystemTray: new SystemTray(),
    AppLauncherButton: new AppLauncherButton(),
    CommandButton: new CommandButton(),
    QuickMenu: new QuickMenu()
};