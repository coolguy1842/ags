import { Monitor } from "types/service/hyprland";
import { getBarComponents } from "./components/components";
import { globals } from "src/globals";
import { Option } from "src/utils/handlers/optionsHandler";

export function Bar(monitor: Monitor) {
    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.name}`,
        anchor: [ "bottom", "left", "right" ],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            class_name: "bar",
            height_request: 32,
            hpack: "fill",
            startWidget: Widget.Box({
                children: []
            }),
            centerWidget: Widget.Box({
                children: []
            }),
            endWidget: Widget.Box({
                children: []
            })
        }),
        setup: (window) => {
            const setupFunc = () => {
                const children: { [key: string]: never[] } = {
                    left: [],
                    center: [],
                    right: []
                };

                const layout = globals.optionsHandler.options.bar.layout.value;
                
                if(layout.left) {
                    for(const component of layout.left) {
                        children["left"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
                    }
                }

                if(layout.center) {
                    for(const component of layout.center) {
                        children["center"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
                    }
                }

                if(layout.right) {
                    for(const component of layout.right) {
                        children["right"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
                    }
                }


                window.child.children[0]!.children = children["left"];
                window.child.children[1]!.children = children["center"];
                window.child.children[2]!.children = children["right"];
            };

            setupFunc();
            globals.optionsHandler.connect("option_changed", (_, option: Option<any>) => {
                if(option.id != "bar.layout") return;

                setupFunc();
            });
        }
    });

    return window;
}