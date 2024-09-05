import { IComponent } from "src/interfaces/IComponent";
import { getWorkspaceSelector } from "./workspaceSelector"
import { getTimeAndNotificationsDisplay } from "./timeAndNotificationsDisplay";

export type TBarComponents = {
    WorkspaceSelector: ReturnType<typeof getWorkspaceSelector>,
    TimeAndNotificationsDisplay: ReturnType<typeof getTimeAndNotificationsDisplay>
}

export function getBarComponents(): TBarComponents {
    return {
        WorkspaceSelector: getWorkspaceSelector(),
        TimeAndNotificationsDisplay: getTimeAndNotificationsDisplay(),
    };
}