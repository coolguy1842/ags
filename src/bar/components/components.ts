import { getWorkspaceSelector } from "./workspaceSelector"
import { getTimeAndNotificationsDisplay } from "./timeAndNotificationsDisplay";
import { getAppLauncherButton } from "./appLauncherButton";
import { getQuickMenuButton } from "./quickMenuButton";

export type TBarComponents = {
    AppLauncherButton: ReturnType<typeof getAppLauncherButton>,
    WorkspaceSelector: ReturnType<typeof getWorkspaceSelector>,
    TimeAndNotificationsDisplay: ReturnType<typeof getTimeAndNotificationsDisplay>,
    QuickMenuButton: ReturnType<typeof getQuickMenuButton>,
}

export function getBarComponents(): TBarComponents {
    return {
        AppLauncherButton: getAppLauncherButton(),
        WorkspaceSelector: getWorkspaceSelector(),
        TimeAndNotificationsDisplay: getTimeAndNotificationsDisplay(),
        QuickMenuButton: getQuickMenuButton()
    };
}