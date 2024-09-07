export function getAppLauncherButton() {
    const defaultProps = {};

    return {
        name: "AppLauncherButton",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-app-launcher-button",
                label: "",
                // label: "󰣛"
                onClicked: () => {
                    // TODO: open app launcher here
                }
            }); 
        }
    };
}