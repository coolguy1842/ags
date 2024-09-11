import { IBarWidget } from "src/interfaces/barWidget";
import { WorkspaceButton } from "../components/workspaceButton";

const hyprland = await Service.import("hyprland");

type ScrollDirection = "inverted" | "normal";
const defaultProps = {
    scroll_direction: "normal" as ScrollDirection
};

function _validateProps<TProps extends typeof defaultProps>(props: TProps, fallback: TProps): TProps | undefined {
    if(props == undefined || typeof props != "object") {
        return fallback;
    }

    const newProps = Object.assign({}, props) as TProps;
    for(const key in props) {
        if(fallback[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in defaultProps) {
        if(newProps[key] == undefined) {
            newProps[key] = fallback[key];
        }
    }

    switch(newProps.scroll_direction) {
    case "inverted": case "normal": break;
    default: newProps.scroll_direction = fallback.scroll_direction;
    }

    return newProps;
}

function propsValidator(props: typeof defaultProps, previousProps?: typeof defaultProps) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}


function create(monitor: string, props: typeof defaultProps) {
    return Widget.EventBox({
        class_name: "bar-workspace-selector",
        child: Widget.Box({
            children: hyprland.bind("workspaces")
                .transform(workspaces => workspaces
                    .filter(x => x.monitor == monitor && !x.name.startsWith("special"))
                    .sort((a, b) => a.id - b.id)
                    .map(x => WorkspaceButton(monitor, x.id))
                )
        }),
        onScrollDown: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "-" : "+"}1`),
        onScrollUp: () => hyprland.messageAsync(`dispatch workspace m${props.scroll_direction == "inverted" ? "+" : "-"}1`)
    }); 
}

export class WorkspaceSelector implements IBarWidget<typeof defaultProps, ReturnType<typeof create>> {
    name = "WorkspaceSelector";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create = create;
};