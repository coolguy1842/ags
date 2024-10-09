import Gtk from "gi://Gtk?version=3.0";

export type TBarWidgetMonitor = {
    // plugname e.g DP-1
    plugname: string,
    // the id from gtk can sometimes be different after a monitor is disconnected and connected
    id: number
};

export abstract class BarWidget<TProps extends object> {
    protected _validateProps(props: TProps, fallback: TProps): TProps | undefined {
        return Object.assign({}, props) as TProps;
    }
    
    protected _basicPropsValidator(props: TProps, fallback: TProps): TProps {
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

    protected _name: string;
    protected _defaultProps: TProps;

    get name() { return this._name; }
    get defaultProps() { return this._defaultProps; }

    constructor(name: string, defaultProps: TProps) {
        this._name = name;
        this._defaultProps = defaultProps;
    }

    
    propsValidator(props: TProps, previousProps?: TProps): TProps | undefined {
        const fallback = this._validateProps(previousProps ?? this._defaultProps, this._defaultProps) ?? this.defaultProps;
        return this._validateProps(this._basicPropsValidator(props, fallback), fallback);
    }

    create(monitor: TBarWidgetMonitor, props: TProps): Gtk.Widget {
        return Widget.Box();
    }
};