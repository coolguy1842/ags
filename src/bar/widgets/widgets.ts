import { AppLauncherButton } from "./appLauncherButton";
import { Clock } from "./clock";
import { ColorPickerButton } from "./colorPickerButton";
import { ScreenshotButton } from "./screenshotButton";
import { SystemTray } from "./systemTray";
import { WorkspaceSelector } from "./workspaceSelector";

export const BarWidgets = {
    AppLauncherButton: new AppLauncherButton(),
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    SystemTray: new SystemTray(),
    ScreenshotButton: new ScreenshotButton(),
    ColorPickerButton: new ColorPickerButton()
};