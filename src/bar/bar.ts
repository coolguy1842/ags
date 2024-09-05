import { Monitor } from "types/service/hyprland";
import { getBarComponents } from "./components/components";
import { globals } from "src/globals";

export function Bar(monitor: Monitor) {
    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.name}`,
        anchor: [ "bottom", "left", "right" ],
        exclusivity: "exclusive",
        child: Widget.Box({
            class_name: "bar",
            height_request: 32,
            children: []
        }),
        setup: (window) => {
            const setupFunc = () => {
                const children = [] as typeof window.child.children;

                const layout = globals.optionsHandler.options.bar.layout.value;
                for(const component of layout) {
                    children.push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
                }

                window.child.children = children;
            };

            setupFunc();
            globals.optionsHandler.on("option_changed", (_event, data) => {
                if(data.option != "bar.layout") return;

                setupFunc();
            });
        }
    });

    return window;
}