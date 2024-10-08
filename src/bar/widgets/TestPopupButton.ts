import { globals } from "src/globals";
import { basicBarWidgetPropsValidator, IBarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";

//#region PROPS

const defaultProps = {};

type PropsType = typeof defaultProps;

function _validateProps<TProps extends PropsType>(props: TProps, fallback: TProps): TProps {
    const newProps = Object.assign({}, props) as TProps;

    return newProps;
}

function propsValidator(props: PropsType, previousProps?: PropsType) {
    const fallback = _validateProps(previousProps ?? defaultProps, defaultProps);
    return _validateProps(basicBarWidgetPropsValidator(props, fallback), fallback);
}

//#endregion

export class TestPopupButton implements IBarWidget<PropsType> {
    name = "TestPopupButton";
    defaultProps = defaultProps;

    propsValidator = propsValidator;
    create(monitor: TBarWidgetMonitor, _props: PropsType) {
        return Widget.Button({
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
            
                testPopup.once("hide", () => {
                    startDerived.stop();
                    endDerived.stop();
                });

                globals.popupWindows?.TestPopupWindow.show(monitor.id, startDerived, endDerived);
            }
        });
    }
};