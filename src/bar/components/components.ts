import { IComponent } from "src/interfaces/IComponent";
import { getWorkspaceSelector } from "./workspaceSelector"
import { getTimeAndNotificationsDisplay } from "./timeAndNotificationsDisplay";

export type TBarComponents = {
    WorkspaceSelector: IComponent,
    TimeAndNotificationsDisplay: IComponent
}

export function getBarComponents(): TBarComponents {
    return {
        WorkspaceSelector: getWorkspaceSelector(),
        TimeAndNotificationsDisplay: getTimeAndNotificationsDisplay(),
    };
}