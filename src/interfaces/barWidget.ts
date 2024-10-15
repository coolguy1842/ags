import Gtk from "gi://Gtk?version=3.0";
import { globals } from "src/globals";
import { HEXtoGdkRGBA } from "src/utils/colorUtils";
import { copyObject, icon } from "src/utils/utils";

export type TBarWidgetMonitor = {
    // plugname e.g DP-1
    plugname: string,
    // the id from gtk can sometimes be different after a monitor is disconnected and connected
    id: number
};

export abstract class BarWidget<TProps extends object> {
    protected loadPixbuf(name: string) {
        const { bar } = globals.optionsHandler!.options;
        return icon(name).load_symbolic(HEXtoGdkRGBA(bar.icon_color.value), null, null, null)[0];
    }


    protected _validateProps(props: TProps, fallback: TProps): TProps | undefined {
        return props;
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
        const defaultProps = copyObject(this._defaultProps);

        var previous: TProps | undefined;
        var fallback = defaultProps;
        if(previousProps) {
            previous = copyObject(previousProps);
            fallback = this._validateProps(previous, defaultProps) ?? defaultProps;
        }
        
        const current = copyObject(props);
        return this._validateProps(this._basicPropsValidator(current, fallback), fallback);
    }

    create(monitor: TBarWidgetMonitor, props: TProps): Gtk.Widget {
        return Widget.Box();
    }
};