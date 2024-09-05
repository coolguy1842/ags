import { IComponent } from "src/interfaces/IComponent";
import { globals } from "src/globals";

export function getTimeAndNotificationsDisplay(): IComponent {
    return {
        name: "TimeAndNotificationsDisplay",
        props: {},
        create(monitor) {
            return Widget.Box({
                class_name: "bar-time-and-notifications-display",
                child: Widget.Label({
                    label: globals.clock.bind().transform((v) => v.format("%a %b %d, %H:%M:%S") ?? "")
                })
            }); 
        }
    };
}