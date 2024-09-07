export function getQuickMenuButton() {
    const defaultProps = {};
    
    return {
        name: "QuickMenuButton",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-quick-menu-button",
                // TODO: make the icons appear dynamically (probably with Utils.derive)
                label: "󰖩 󰂯  󱊣 ",
                onClicked: () => {
                    // TODO: open quick menu here
                }
            }); 
        }
    };
}