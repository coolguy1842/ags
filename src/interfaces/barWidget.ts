import Gtk from "gi://Gtk?version=3.0";

export type TBarWidgetMonitor = {
    // plugname e.g DP-1
    plugname: string,
    // the id from gtk can sometimes be different after a monitor is disconnected and connected
    id: number
};

export interface IBarWidget<TProps extends object> {
    name: string,
    defaultProps: TProps,
    
    propsValidator(props: TProps): TProps | undefined;
    create(monitor: TBarWidgetMonitor, props: TProps): Gtk.Widget;
};


export function basicBarWidgetPropsValidator<TProps extends object>(props: TProps, fallback: TProps): TProps {
    if(props == undefined || typeof props != "object") {
        return fallback;
    }

    const newProps = Object.assign({}, props) as TProps;
    for(const key in props) {
        if(fallback[key] == undefined) {
            delete newProps[key];
        }
    }

    for(const key in fallback) {
        if(newProps[key] == undefined) {
            newProps[key] = fallback[key];
        }
    }

    return newProps;
}