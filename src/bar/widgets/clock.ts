import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { globals } from "src/globals";
import { PopupWindow } from "src/utils/PopupWindow";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

//#region PROPS

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

//#endregion

const TestPopupWidget = Widget.Box({
    children: [
        Widget.Label("test")
    ]    
})

export const TestPopupWindow = new PopupWindow({
    name: "test-popup"
}, TestPopupWidget);

function create(monitor: TBarWidgetMonitor, props: typeof defaultProps) {
    return Widget.Button({
        className: "bar-clock",
        label: globals.clock.bind().transform(clock => clock.format("%a %b %d, %H:%M:%S") ?? ""),
        onClicked: (self) => {
            console.log("test");

            const getAllocation = () => {
                if(self.is_destroyed || !self.get_accessible()) {
                    return {
                        x: 0, y: 0
                    }
                };

                const allocation = self.get_allocation();
                console.log(allocation.y);
                return {
                    x: allocation.x,
                    y: 1080 - allocation.y
                }
            }

            TestPopupWindow.show(monitor.number, new Variable(getAllocation(), {
                poll: [
                    500, 
                    (variable) => {
                        if(self.is_destroyed || !self.get_accessible()) {
                            variable.stopPoll();
                        }

                        return getAllocation();
                    }
                ]
            }));
        }
    });
}

export class Clock implements IBarWidget<typeof defaultProps, ReturnType<typeof create>> {
    name = "Clock";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create = create;
};