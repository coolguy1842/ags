import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { BarWidget, TBarWidgetMonitor } from "src/interfaces/barWidget";
import { NumberValidator } from "src/options/validators/numberValidator";
import { toggleQuickMenuPopup } from "src/popups/QuickMenuPopupWindow";

import Box from "types/widgets/box";
import Icon from "types/widgets/icon";

const defaultProps = {
    icon_size: 12,
    spacing: 3,

    horizontal_padding: 6,
    vertical_padding: 2
};

const battery = await Service.import("battery");

type PropsType = typeof defaultProps;
export class QuickMenu extends BarWidget<PropsType> {
    constructor() { super("QuickMenu", defaultProps); }
    protected _validateProps(props: PropsType, fallback: PropsType): PropsType | undefined {
        return {
            icon_size: NumberValidator.create({ min: 1 }).validate(props.icon_size, fallback.icon_size) ?? fallback.icon_size,
            spacing: NumberValidator.create({ min: 0 }).validate(props.spacing, fallback.spacing) ?? fallback.spacing,

            horizontal_padding: NumberValidator.create({ min: 0 }).validate(props.horizontal_padding, fallback.icon_size) ?? fallback.horizontal_padding,
            vertical_padding: NumberValidator.create({ min: 0 }).validate(props.vertical_padding, fallback.icon_size) ?? fallback.vertical_padding
        };
    }

    create(monitor: TBarWidgetMonitor, props: PropsType) {
        return Widget.Button({
            classNames: [ "bar-widget-quick-menu" ],
            css: `padding: ${props.vertical_padding}px ${props.horizontal_padding}px`,
            onClicked: (self) => {
                toggleQuickMenuPopup(monitor.id, self);
            },
            child: Widget.Box({
                visible: true,
                spacing: props.spacing,
                setup: (self) => {
                    const update = () => this.loadIcons(self, props);

                    update();
                }
            })
        });
    }

    private loadIcons(self: Box<any, any>, props: PropsType) {
        const { icons, bar } = globals.optionsHandler!.options;

        const addIcon = (iconPath: Variable<string>) => {
            return Widget.Icon({
                size: props.icon_size,
                setup: (self) => {
                    const loadIcon = () => self.icon = this.loadPixbuf(iconPath.value);
                    
                    loadIcon();
                    self.hook(iconPath, loadIcon);
                    self.hook(bar.icon_color, loadIcon);
                }
            });
        }

        const children: Icon<unknown>[] = [];
        
        children.push(addIcon(icons.bar.power));
        self.children = children;
    }
};