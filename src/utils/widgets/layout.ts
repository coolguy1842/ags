import { BaseProps, Widget } from 'types/widgets/widget';

import Gtk from 'gi://Gtk?version=3.0';
import { registerObject } from '../utils';

export type LayoutProps<
    Attr = unknown,
    Self = Layout<Attr>,
> = BaseProps<Self, Gtk.Layout.ConstructorProperties, Attr>

export function newLayout<
    Attr = unknown
>(...props: ConstructorParameters<typeof Layout<Attr>>) {
    return new Layout(...props);
}

export interface Layout<Attr> extends Widget<Attr> { }
export class Layout<Attr> extends Gtk.Layout {
    static {
        registerObject(this);
    }

    constructor(props: LayoutProps<Attr> = {}) {
        super(props as Gtk.Layout.ConstructorProperties);
    }
}

export default Layout;