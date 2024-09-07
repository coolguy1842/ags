export function getColorPickerButton() {
    const defaultProps = {
        color_pick_command: `bash -c 'hyprpicker -r --format=hex -a'`
    };

    return {
        name: "ScreenshotButton",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-color-picker-button",
                label: "󰈊",
                onClicked: () => {
                    Utils.execAsync(props.color_pick_command);
                }
            }); 
        }
    };
}