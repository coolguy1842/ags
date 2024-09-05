import { IComponent } from "src/interfaces/IComponent";
import { getWorkspaceSelector } from "./workspaceSelector"

export type TBarComponents = {
    WorkspaceSelector: IComponent
}

export function getBarComponents(): TBarComponents {
    return {
        WorkspaceSelector: getWorkspaceSelector()
    };
}