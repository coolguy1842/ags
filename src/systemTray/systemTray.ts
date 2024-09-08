import { PopupWindow } from "src/utils/PopupWindow";

const SystemTrayWidget = Widget.Box({
    css: "background-color: red;",
    clickThrough: false,
    children: [
        Widget.Label("test")
    ]
})

const SystemTrayWindow = new PopupWindow({
    name: "system-tray-window",
    exclusivity: "exclusive",
}, SystemTrayWidget);

export function PopupSystemTray(position: { x: number, y: number }) {
    SystemTrayWindow.reveal(position);
}


export { SystemTrayWidget, SystemTrayWindow };