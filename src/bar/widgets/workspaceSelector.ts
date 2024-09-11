import { IBarWidget } from "src/interfaces/IBarWidget";
import { WorkspaceButton } from "../components/workspaceButton";
import Gtk from "gi://Gtk?version=3.0";

const hyprland = await Service.import("hyprland");

type ScrollDirection = "inverted" | "normal";
const defaultProps = {
    scroll_direction: "normal" as ScrollDirection
};

function create(monitor: string, props: typeof defaultProps) {
    return Widget.Label("test");
}

function propsValidator(props: typeof defaultProps) {
    if(props == undefined || typeof props != "object") {
        return undefined;
    }

    const newProps = Object.assign({}, props) as typeof defaultProps;
    for(const key in props) {
        if(defaultProps[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in defaultProps) {
        if(newProps[key] == undefined) {
            newProps[key] = defaultProps[key];
        }
    }

    switch(newProps.scroll_direction) {
    case "inverted": case "normal": break;
    default: newProps.scroll_direction = defaultProps.scroll_direction;
    }

    return newProps;
}

export class WorkspaceSelector implements IBarWidget<typeof defaultProps, ReturnType<typeof create>> {
    name = "WorkspaceSelector";
    defaultProps = defaultProps;

    create = create;
    propsValidator = propsValidator;
};

// export function getWorkspaceSelector() {
//     const defaultProps: {
//         scroll_direction: ScrollDirection
//     } = {
//         scroll_direction: "normal"
//     };

//     return {
//         name: "WorkspaceSelector",
//         props: defaultProps,
//         propsValidator(props: typeof defaultProps) {
//             return props;
//         },
//         create(monitor: string, props: typeof defaultProps) {
//             return Widget.EventBox({
//                 class_name: "bar-workspace-selector",
//                 child: Widget.Box({
//                     children: hyprland.bind("workspaces")
//                         .transform(workspaces => workspaces
//                             .filter(x => x.monitor == monitor && !x.name.startsWith("special"))
//                             .sort((a, b) => a.id - b.id)
//                             .map(x => WorkspaceButton(monitor, x.id))
//                         )
//                 }),
//                 onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "normal" ? "-" : "+"}1`),
//                 onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "normal" ? "+" : "-"}1`)
//             }); 
//         }
//     };
// }