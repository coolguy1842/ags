export function getAppLauncherButton() {
    return {
        name: "AppLauncherButton",
        props: {},
        create(monitor: string) {
            return Widget.Button({
                class_name: "bar-app-launcher-button",
                label: "",
                // label: "󰣛"
                onClicked: () => {
                    // open app launcher here
                }
            }); 
        }
    };
}