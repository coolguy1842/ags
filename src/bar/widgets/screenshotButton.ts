export function getScreenshotButton() {
    const defaultProps = {
        screenshot_command: `bash -c 'wayfreeze & PID=$!; sleep .1; grim -g "$(slurp)" - | wl-copy; kill $PID'`
    };

    return {
        name: "ScreenshotButton",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-screenshot-button",
                label: "󰄀",
                onClicked: () => {
                    Utils.execAsync(props.screenshot_command);
                }
            }); 
        }
    };
}