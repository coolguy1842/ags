import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";

const defaultProps = {};
type PropsType = typeof defaultProps;

export class TestPopupButton extends BarWidget<PropsType> {
    constructor() { super("TestPopupButton", defaultProps); }

    create(monitor: TBarWidgetMonitor, _props: PropsType) {
        return Widget.Box({
            child: Widget.Button({
                classNames: [ "bar-widget-test-popup-button", "bar-button" ],
                child: Widget.Label("test"),
                onClicked: () => {
                    const testPopup = globals.popupWindows?.TestPopupWindow;
                    if(!testPopup) return;
                    if(testPopup.window.is_visible() && testPopup.window.monitor == monitor.id) {
                        testPopup.hide();
                
                        return;
                    }
                
                    const endDerived = new DerivedVariable(
                        [
                            testPopup.screenBounds,
                            testPopup.childAllocation
                        ],
                        (screenBounds, childAllocation) => {
                            return {
                                x: (screenBounds.width / 2) - (childAllocation.width / 2),
                                y: screenBounds.height - 15
                            }
                        }
                    );
                
                    const startDerived = new DerivedVariable(
                        [
                            endDerived,
                            testPopup.screenBounds,
                            testPopup.childAllocation
                        ],
                        (end, screenBounds, childAllocation) => {
                            return {
                                x: end.x,
                                y: screenBounds.height + childAllocation.height
                            }
                        }
                    );
                
                    const onStop = () => {
                        startDerived.stop();
                        endDerived.stop();
                    };
    
                    testPopup.onceMulti({
                        "hideComplete": onStop,
                        "cleanup": onStop
                    });
    
                    testPopup.show(monitor.id, startDerived, endDerived);
                }
            })
        });
    }
};