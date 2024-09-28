import Gtk from "gi://Gtk?version=3.0";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { BaseProps, Widget as TWidget } from "types/widgets/widget";
import { newLayout as Layout } from './layout';

export default function W<
    T extends { new(...args: any[]): Gtk.Widget },
    Props,
>(
    Base: T, typename = Base.name,
) {
    class Subclassed extends Base {
        static {
            registerGObject(this, { typename: `${typename}_${Date.now()}` });
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
}

W.subclass = W;
W.Layout = Layout;