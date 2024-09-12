import { IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { globals } from "src/globals";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { DerivedVariable } from "src/utils/utils";
import Gtk from "gi://Gtk?version=3.0";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";

//#region PROPS

const defaultProps = {
    clock_format: "%a %b %d, %H:%M:%S"
};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps | undefined {
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

    const formatted = globals.clock.value.format(newProps.clock_format);
    if(formatted == null) {
        newProps.clock_format = fallback.clock_format;
    }

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps) ?? defaultProps;
    return _validateProps(props, fallback);
}

//#endregion

const TestPopupWidget = Widget.Box({
    css: "background-color: black;",
    widthRequest: 150,
    height_request: 100,
    children: [
        Widget.Label({        
            widthRequest: 150,
            height_request: 100,
            label: "test"
        })
    ]
});

export const TestPopupWindow = new PopupWindow(
    {
        name: "test-popup",
        keymode: "on-demand"
    },
    TestPopupWidget,
    {
        animation: PopupAnimations.Ease,
        duration: 0.4,
        refreshRate: 165,
        startPosition: {
            x: 0,
            y: 0
        }
    }
);


export class Clock implements IBarWidget<PropsType, Gtk.Button> {
    name = "Clock";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            className: "bar-clock",
            label: globals.clock.bind().transform(clock => clock.format(props.clock_format) ?? ""),
            onClicked: (self) => {
                const getAllocation = () => {
                    if(self.is_destroyed || !self.get_accessible()) {
                        return {
                            x: 0, y: 0
                        }
                    };
    
                    const allocation = self.get_allocation();
                    return {
                        x: allocation.x + (allocation.width / 2),
                        y: allocation.y + allocation.height
                    }
                }
    
                const variable = new Variable(getAllocation(), {
                    poll: [
                        250, 
                        (variable) => {
                            if(self.is_destroyed || !self.get_accessible()) {
                                variable.stopPoll();
                            }
    
                            return getAllocation();
                        }
                    ]
                });
    
                const derived = new DerivedVariable(
                    [
                        variable,
                        TestPopupWindow.childAllocation
                    ],
                    (allocation, childAllocation) => {
                        const out = {
                            x: allocation.x - (childAllocation.width / 2),
                            y: allocation.y + childAllocation.height + 10
                        };
    
                        return out;
                    }
                );
    
                TestPopupWindow.animationOptions!.startPosition = Utils.derive([derived], (variable) => {
                    return {
                        x: variable.x,
                        y: 0
                    };
                });
                

                TestPopupWindow.onHide = () => {
                    variable.stopPoll();
                    derived.stop();
                };
    
                TestPopupWindow.show(monitor.id, derived);
            }
        });
    }
};