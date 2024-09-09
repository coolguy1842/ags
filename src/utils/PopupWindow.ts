import Gtk from "gi://Gtk?version=3.0";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { WindowProps } from "types/widgets/window";

export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _displayPosition: { x: number, y: number };

    private _window: Window<Gtk.Fixed, Attr>;
    private _fixed: Gtk.Fixed = Widget.Fixed({});

    private _childWrapper: Gtk.Widget;
    private _originalChild: Child;

    private _shouldClose: boolean;


    private getChildAllocation() {
        const visible = this.window.is_visible();
        this.window.set_visible(true);

        const allocation = this._childWrapper.get_allocation();

        this.window.set_visible(visible);
        return allocation;
    }

    private reloadFixed() {
        const allocation = this.getChildAllocation();
        const geometry = this._window.screen.get_monitor_geometry(this._window.monitor);

        this._displayPosition.x = Math.min(geometry.width - allocation.width, this._displayPosition.x);
        this._displayPosition.x = Math.max(0, this._displayPosition.x);

        this._displayPosition.y = Math.max(allocation.height, this._displayPosition.y);
        this._displayPosition.y = Math.min(geometry.height, this._displayPosition.y);

        this._fixed.move(this._childWrapper, this._displayPosition.x, this._displayPosition.y - (allocation.height));
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

        this._shouldClose = true;

        this._window.keybind("Escape", () => {
            if(!this._window.is_visible()) return;
            this.hide();
        });

        this._window.on("button-press-event", (self, args) => {
            if(this._shouldClose) {
                this.hide();
                return;
            }

            this._shouldClose = true;
        });

        this._fixed = this._window.child;
        this._childWrapper = Widget.EventBox({
            css: "all: unset",
            visible: true,
            setup: (self) => {
                self.connect("button-press-event", (args) => {
                    this._shouldClose = false;
                });
            }
        });

        this._originalChild = toPopup;
        this._displayPosition = { x: 0, y: 0 };

        this.child = this._originalChild;
    }


    get window() { return this._window; }

    get child() { return this._originalChild; }
    set child(child: Child) {
        this._fixed.remove(this._childWrapper);

        this._originalChild = child;
        (this._childWrapper as any).child = this._originalChild;

        this._fixed.put(this._childWrapper, this._displayPosition.x, this._displayPosition.y);
        this.reloadFixed();
    }


    show(monitor: number, position: { x: number, y: number }) {
        this._displayPosition = position;
        this._window.monitor = monitor;

        this.reloadFixed();

        this._window.set_visible(true);
    }

    hide() {
        this._shouldClose = true;
        this._window.set_visible(false);
    }
};