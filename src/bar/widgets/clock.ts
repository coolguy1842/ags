import { IBarWidget } from "src/interfaces/barWidget";
import { WorkspaceButton } from "../components/workspaceButton";
import { globals } from "src/globals";

const defaultProps = {};

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

    return newProps;
}

function propsValidator(props: typeof defaultProps, previousProps?: typeof defaultProps) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}


function create(monitor: string, props: typeof defaultProps) {
    return Widget.Label({
        className: "bar-clock",
        label: globals.clock.bind().transform(clock => clock.format("%a %b %d, %H:%M:%S") ?? "")
    });
}

export class Clock implements IBarWidget<typeof defaultProps, ReturnType<typeof create>> {
    name = "Clock";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create = create;
};