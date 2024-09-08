import { PopupWindow } from "src/utils/PopupWindow";

const SystemTrayWidget = Widget.Box({
    width_request: 100,
    height_request: 100,
    css: "background-color: blue;",
    children: [
        Widget.Label("test")
    ]
})

const SystemTrayWindow = new PopupWindow({
    name: "system-tray-window",
    exclusivity: "exclusive",
    setup: (self) => {
        self.keybind("Escape", () => {
            console.log("esc")
        })
    }
}, SystemTrayWidget);

export { SystemTrayWidget, SystemTrayWindow };