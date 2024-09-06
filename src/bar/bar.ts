import { Monitor } from "types/service/hyprland";
import { getBarComponents } from "./components/components";
import { globals } from "src/globals";
import { Option } from "src/utils/handlers/optionsHandler";

export function Bar(monitor: Monitor) {
    const layout = globals.optionsHandler.options.bar.layout;

    const window = Widget.Window({
        monitor: monitor.id,
        name: `bar-${monitor.name}`,
        class_name: "bar",
        anchor: [ "bottom", "left", "right" ],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            height_request: 32,
            startWidget: Widget.Box({
                hexpand: true,
                children: layout.left.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            }),
            centerWidget: Widget.Box({
                hpack: "center",
                children: layout.center.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            }),
            endWidget: Widget.Box({
                hexpand: true,
                children: layout.right.bind().as(c => c.map(x => getBarComponents()[x.name].create(monitor.name, x.props)))
            })
        }),
        setup: (window) => {
            // const setupFunc = () => {
            //     const children: { [key: string]: never[] } = {
            //         left: [],
            //         center: [],
            //         right: []
            //     };

            //     const layout = globals.optionsHandler.options.bar.layout.value;
                
            //     if(layout.left) {
            //         for(const component of layout.left) {
            //             children["left"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
            //         }
            //     }

            //     if(layout.center) {
            //         for(const component of layout.center) {
            //             children["center"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
            //         }
            //     }

            //     if(layout.right) {
            //         for(const component of layout.right) {
            //             children["right"].push(getBarComponents()[component.name].create(monitor.name, component.props) as never);
            //         }
            //     }


            //     window.child.children[0]!.children = children["left"];
            //     window.child.children[1]!.children = children["center"];
            //     window.child.children[2]!.children = children["right"];
            // };

            // setupFunc();
            // globals.optionsHandler.connect("option_changed", (_, option: Option<any>) => {
            //     if(option.id != "bar.layout") return;

            //     setupFunc();
            // });
        }
    });

    return window;
}