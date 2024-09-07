import { getWorkspaceSelector } from "./workspaceSelector"
import { getTimeAndNotificationsDisplay } from "./timeAndNotificationsDisplay";
import { getAppLauncherButton } from "./appLauncherButton";
import { getQuickMenuButton } from "./quickMenuButton";
import { getScreenshotButton } from "./screenshotButton";
import { getColorPickerButton } from "./colorPickerButton";
import { getSystemTray } from "./systemTray";

export function getBarWidgets() {
    return {
        AppLauncherButton: getAppLauncherButton(),
        WorkspaceSelector: getWorkspaceSelector(),
        TimeAndNotificationsDisplay: getTimeAndNotificationsDisplay(),
        SystemTray: getSystemTray(),
        ScreenshotButton: getScreenshotButton(),
        ColorPickerButton: getColorPickerButton(),
        QuickMenuButton: getQuickMenuButton()
    };
}