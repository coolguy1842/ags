import { BaseProps, Widget as TWidget } from "types/widgets/widget";
import { newLayout as Layout } from './layout';

import Gtk from "gi://Gtk?version=3.0";
import { registerObject } from "../utils";

export default function W<T extends { new(...args: any[]): Gtk.Widget }, Props>(Base: T) {
    class Subclassed extends Base {
        static {
            registerObject(this);
        }

        constructor(...params: any[]) {
            super(...params);
        }
    }

    type Instance<Attr> = InstanceType<typeof Subclassed> & TWidget<Attr>;
    return <Attr>(props: BaseProps<Instance<Attr>, Props, Attr>) => {
        return new Subclassed(props) as Instance<Attr>;
    };
}

export {
    W as subclass,
    Layout
};

W.subclass = W;
W.Layout = Layout;