// code from https://github.com/Aylur/dotfiles/blob/18b83b2d2c6ef2b9045edefe49a66959f93b358a/ags/widget/PopupWindow.ts

import Gtk from "gi://Gtk?version=3.0";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { register } from "resource:///com/github/Aylur/ags/widgets/widget.js";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { WindowProps } from "types/widgets/window";
// import Window, { WindowProps } from "types/widgets/window";

export class PopupWindow<Child extends Gtk.Widget, Attr> extends Window<Gtk.Widget, Attr> {
    static {
        registerGObject(this, {
            typename: `Ags_PopupWindow_${Date.now()}`,
            properties: {
                'anchor': ['jsobject', 'rw'],
                'exclusive': ['boolean', 'rw'],
                'exclusivity': ['string', 'rw'],
                'focusable': ['boolean', 'rw'],
                'layer': ['string', 'rw'],
                'margins': ['jsobject', 'rw'],
                'monitor': ['int', 'rw'],
                'gdkmonitor': ['jsobject', 'rw'],
                'popup': ['boolean', 'rw'],
                'keymode': ['string', 'rw'],
            },
        });
    }


    private _displayPosition: { x: number, y: number };

    private _fixed: Gtk.Fixed = Widget.Fixed({});
    private _padding: Gtk.Widget[];

    private _originalChild: Child;

    private reloadFixed() {
        for(const padding of this._padding) {
            this._fixed.remove(padding);
        }

        this._padding = [];
        this._fixed.move(this._originalChild, this._displayPosition.x, this._displayPosition.y);

        const allocation = this._originalChild.get_allocation();
        console.log(`x: ${allocation.x}, y: ${allocation.y}, width: ${allocation.width}, height: ${allocation.height}`);
    }

    constructor({
        anchor = [ "bottom", "top", "left", "right" ],
        exclusive,
        exclusivity = 'ignore',
        focusable = false,
        keymode = 'on-demand',
        layer = 'top',
        margins = [],
        monitor = -1,
        gdkmonitor,
        popup = true,
        visible = false,
        ...params
    }: WindowProps<Child, Attr> = {}, child: Child) {
        super({
            anchor,
            exclusive,
            exclusivity,
            focusable,
            keymode,
            layer,
            margins,
            monitor,
            gdkmonitor,
            popup,
            visible,
            child: Widget.Fixed({
                css: "background-color: red;",
                // hexpand: true,
                // vexpand: true,
            }),
            ...params
        } as WindowProps<Gtk.Widget, Attr>);

        this._fixed = super.child as Gtk.Fixed;

        this._originalChild = child;

        this._padding = [];

        this._displayPosition = { x: 0, y: 0 };
        this.child = this._originalChild;
    }


    get child() { return this._originalChild; }

    set child(child: Child) {
        this._fixed.remove(this._originalChild);
        this._originalChild = child;

        this._fixed.put(this._originalChild, this._displayPosition.x, this._displayPosition.y);
        this.reloadFixed();
    }


    reveal(position: { x: number, y: number }) {
        this._displayPosition = position;
        this.reloadFixed();

        this.set_visible(true);
    }

    hide() {
        this.set_visible(false);
    }
};