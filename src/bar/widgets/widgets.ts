import { AppLauncherButton } from "./AppLauncherButton";
import { Clock } from "./Clock";
import { SystemTray } from "./SystemTray";
import { TestPopupButton } from "./TestPopupButton";
import { WorkspaceSelector } from "./WorkspaceSelector";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    TestPopupButton: new TestPopupButton(),
    SystemTray: new SystemTray(),
    AppLauncherButton: new AppLauncherButton()
};