import { Clock } from "./Clock";
import { TestPopupButton } from "./TestPopupButton";
import { WorkspaceSelector } from "./WorkspaceSelector";

export const BarWidgets = {
    WorkspaceSelector: new WorkspaceSelector(),
    Clock: new Clock(),
    TestPopupButton: new TestPopupButton()
};