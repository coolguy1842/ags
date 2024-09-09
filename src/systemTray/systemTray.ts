import { PopupWindow } from "src/utils/PopupWindow";

const SystemTrayWidget = Widget.EventBox({
    visible: true,
    child: Widget.Box({
        width_request: 100,
        height_request: 100,
        css: "background-color: blue;",
        children: [
            Widget.Button({
                child: Widget.Label({
                    width_request: 100,
                    height_request: 100,
                    label: "test"
                })
            })
        ]
    })
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