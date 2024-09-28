import Gtk from "gi://Gtk?version=3.0";

export type TBarWidgetMonitor = {
    // plugname e.g DP-1
    plugname: string,
    // the id from gtk can sometimes be different after a monitor is disconnected and connected
    id: number
};

export interface IBarWidget<TProps extends object, Child extends Gtk.Widget> {
    name: string,
    defaultProps: TProps,
    
    propsValidator(props: TProps): TProps | undefined;
    create(monitor: TBarWidgetMonitor, props: TProps): Child;
};