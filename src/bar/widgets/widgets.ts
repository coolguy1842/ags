import { AppLauncherButton } from "./AppLauncherButton";
import { Clock } from "./Clock";
import { ColorPickerButton } from "./ColorPickerButton";
import { ScreenshotButton } from "./ScreenshotButton";
import { SystemTray } from "./SystemTray";
import { WorkspaceSelector } from "./WorkspaceSelector";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    SystemTray: new SystemTray(),
    AppLauncherButton: new AppLauncherButton(),
    ColorPickerButton: new ColorPickerButton(),
    ScreenshotButton: new ScreenshotButton()
};