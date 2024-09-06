export function getQuickMenuButton() {
    return {
        name: "QuickMenuButton",
        props: {},
        create(monitor: string) {
            return Widget.Button({
                class_name: "bar-quick-menu-button",
                // make the icons appear dynamically (probably with Utils.derive)
                label: "󰖩 󰂯  󱊣 ",
                onClicked: () => {
                    // open quick menu here
                }
            }); 
        }
    };
}