import Gtk from "gi://Gtk?version=3.0";

export type TBarWidgetMonitor = {
    name: string,
    number: number
};

export interface IBarWidget<TProps extends object, Child extends Gtk.Widget> {
    name: string,
    defaultProps: TProps,
    
    propsValidator(props: TProps): TProps | undefined;
    create(monitor: TBarWidgetMonitor, props: TProps): Child;
};