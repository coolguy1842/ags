// code from https://github.com/Aylur/dotfiles/blob/18b83b2d2c6ef2b9045edefe49a66959f93b358a/ags/widget/PopupWindow.ts

import Gtk from "gi://Gtk?version=3.0";
import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { register } from "resource:///com/github/Aylur/ags/widgets/widget.js";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import Gdk from "types/@girs/gdk-3.0/gdk-3.0";
import { WindowProps } from "types/widgets/window";
// import Window, { WindowProps } from "types/widgets/window";

export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _displayPosition: { x: number, y: number };

    private _window: Window<Gtk.Fixed, Attr>;

    private _fixed: Gtk.Fixed = Widget.Fixed({});
    private _padding: Gtk.Widget[];

    private _childWrapper: Gtk.EventBox;
    private _originalChild: Child;

    private reloadFixed() {
        for(const padding of this._padding) {
            this._fixed.remove(padding);
        }

        this._padding = [];
        this._fixed.move(this._childWrapper, this._displayPosition.x, this._displayPosition.y);

        // const allocation = this._originalChild.get_allocation();
        // console.log(`x: ${allocation.x}, y: ${allocation.y}, width: ${allocation.width}, height: ${allocation.height}`);
    }

    constructor({
        anchor = [ "top", "bottom", "left", "right" ],
        exclusive,
        exclusivity = 'ignore',
        focusable = false,
        keymode = 'exclusive',
        layer = 'top',
        margins = [],
        monitor = -1,
        gdkmonitor,
        popup = false,
        visible = false,
        child = undefined,
        ...params
    }: WindowProps<Child, Attr> = {}, toPopup: Child) {
        this._window = Widget.Window({
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
            child: Widget.Fixed(),
            ...params
        } as WindowProps<Gtk.Fixed, Attr>);

        this._window.keybind("Escape", () => {
            if(!this._window.is_visible()) return;
            this.hide();
        });

        // this._window.on("button-press-event", (self, args) => {
        //     console.log("clicked main");
        // })

        this._fixed = this._window.child;

        this._childWrapper = Widget.EventBox({
            visible: true,
            onPrimaryClick: (self) => {
                console.log("clicked box")
            },
            setup: (self) => {
                self.on("leave-notify-event", () => {
                    console.log("clicked box");
                })
            }
        });

        this._originalChild = toPopup;
        this._padding = [];

        this._displayPosition = { x: 0, y: 0 };
        this.child = this._originalChild;
    }


    get window() { return this._window; }

    get child() { return this._originalChild; }
    set child(child: Child) {
        this._fixed.remove(this._childWrapper);

        this._originalChild = child;
        this._childWrapper.child = this._originalChild;

        this._fixed.put(this._childWrapper, this._displayPosition.x, this._displayPosition.y);
        this.reloadFixed();
    }


    show(position: { x: number, y: number }) {
        console.log("show");
        this._displayPosition = position;
        this.reloadFixed();

        this._window.set_visible(true);
    }

    hide() {
        console.log("hide");
        this._window.set_visible(false);
    }
};