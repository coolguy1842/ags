import { globals } from "src/globals";

export function getTimeAndNotificationsDisplay() {
    const defaultProps = {};

    return {
        name: "TimeAndNotificationsDisplay",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Box({
                class_name: "bar-time-and-notifications-display",
                child: Widget.Label({
                    label: globals.clock.bind().transform((v) => v.format("%a %b %d, %H:%M:%S") ?? "")
                })
            }); 
        }
    };
}