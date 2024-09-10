import { AppLauncherWindow } from "src/appLauncher/appLauncher";
import { globals } from "src/globals";
import { PopupAnimationFunctions } from "src/utils/PopupWindow";

const hyprland = await Service.import("hyprland");

export function getAppLauncherButton() {
    const defaultProps = {};

    return {
        name: "AppLauncherButton",
        props: defaultProps,
        create(monitorName: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-app-launcher-button",
                label: "",
                // label: "󰣛"
                onClicked: () => {
                    // TODO: open app launcher here
                    const monitor = hyprland.monitors.find(x => x.name == monitorName);
                    const { app_launcher } = globals.optionsHandler.options;

                    if(monitor) {
                        const position = {
                            x: monitor.width / 2,
                            y: (app_launcher.rows.value * app_launcher.icon_size.value) + 180
                        };

                        if(!AppLauncherWindow.window.is_visible()) {
                            const animation = globals.optionsHandler.options.app_launcher.animation;
                            if(animation.enabled.value) {
                                AppLauncherWindow.animation = {
                                    start: {
                                        x: position.x,
                                        y: 0
                                    },
                                    duration: animation.duration.value,
                                    reverseDuration: animation.reverse_duration.value,
                                    updateRate: animation.update_rate.value,
                                    function: PopupAnimationFunctions.linear
                                }
                            }
                            
                            AppLauncherWindow.show(monitor.id ?? -1, position, true);
                        }
                        else {
                            AppLauncherWindow.hide();
                        }
                        
                    }
                }
            }); 
        }
    };
}