import GLib20 from "gi://GLib";
import Gtk from "gi://Gtk?version=3.0";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { EventBox } from "resource:///com/github/Aylur/ags/widgets/eventbox.js";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { Rectangle } from "types/@girs/gdk-3.0/gdk-3.0.cjs";
import { Allocation } from "types/@girs/gtk-3.0/gtk-3.0.cjs";
import { WindowProps } from "types/widgets/window";

export type TPosition = {
    x: number,
    y: number
};

export type PopupPosition = TPosition | Variable<TPosition>;

export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _position: Variable<TPosition>;
    private _lastPosition: TPosition;
    
    private _positionListener?: number;

    private _window: Window<Gtk.Fixed, Attr>;
    private _fixed: Gtk.Fixed = Widget.Fixed({});

    private _childWrapper: EventBox<Gtk.Widget, unknown>;
    private _child: Child;

    private _shouldClose: boolean;

    private _onShow?: (self: PopupWindow<Child, Attr>) => void;
    private _onHide?: (self: PopupWindow<Child, Attr>) => void;

    private _wrapperAllocation: Variable<Allocation>;
    private _screenBounds: Variable<Rectangle>;


    private moveChild(position: TPosition) {
        const displayPosition = {
            x: Math.floor(position.x),
            y: Math.floor(position.y)
        };

        displayPosition.y = this._screenBounds.value.height - displayPosition.y;

        if(this._lastPosition.x == displayPosition.x && this._lastPosition.y == displayPosition.y) {
            return;
        }

        this._fixed.move(this._childWrapper, displayPosition.x, displayPosition.y);
        this._lastPosition = displayPosition;
    }

    private updateChild() {
        if(!this._window.is_visible()) {
            return;
        }

        this.moveChild(this._position.value);
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
        ...params
    }: WindowProps<Child, Attr> = {}, child: Child, onShow?: typeof this._onShow, onHide?: typeof this._onHide) {
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

        this._onShow = onShow;
        this._onHide = onHide;

        this._window.keybind("Escape", () => {
            if(!this._window.is_visible()) {
                return;
            }

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
            css: "all: unset;",
            visible: true,
            setup: (self) => {
                self.connect("button-press-event", (args) => {
                    this._shouldClose = false;
                });
            }
        });

        this._wrapperAllocation = new Variable({
            x: 0, y: 0,
            width: 0, height: 0
        } as Allocation, {
            poll: [
                500,
                (variable) => {
                    if(this._childWrapper.is_destroyed || !this._childWrapper.get_accessible()) {
                        variable.stopPoll();
                        variable.dispose();

                        return {
                            x: 0, y: 0,
                            width: 0, height: 0
                        } as Allocation;
                    }

                    const is_visible = this._window.is_visible();
                    if(!is_visible) {
                        this._window.set_visible(true);
                    }

                    const allocation = this._childWrapper.get_allocation()
                    this._window.set_visible(is_visible);

                    return allocation;
                }
            ]
        });

        this._screenBounds = new Variable({
            x: 0, y: 0,
            width: 0, height: 0
        } as Rectangle, {
            poll: [
                1000,
                (variable) => {
                    if(this._childWrapper.is_destroyed || !this._childWrapper.get_accessible()) {
                        variable.stopPoll();
                        variable.dispose();

                        return {
                            x: 0, y: 0,
                            width: 0, height: 0
                        } as Rectangle;
                    }

                    const screen = this._window.screen;
                    
                    return screen.get_monitor_geometry(screen.get_monitor_at_window(this._window.window));
                }
            ]
        });

        this._position = new Variable({ x: 0, y: 0 });
        this._lastPosition = this._position.value;

        this._fixed.put(this._childWrapper, 0, 0);
        
        this._child = child
        this.child = this._child;

        this._positionListener = this._position.connect("changed", () => this.updateChild());
        this._wrapperAllocation.connect("changed", () => this.updateChild());
        this._screenBounds.connect("changed", () => this.updateChild());
    }


    get window() { return this._window; }

    get childAllocation() { return this._wrapperAllocation; }

    get child() { return this._child; }
    set child(child: Child) {
        this._child = child;
        (this._childWrapper as any).child = this._child;

        this.moveChild(this._position.value);
    }


    set ononShow(onShow: typeof this._onShow) { this._onShow = onShow; }
    set onHide(onHide: typeof this._onHide) { this._onHide = onHide; }


    private set position(position: PopupPosition) {
        if(position instanceof Variable) {
            if(this._positionListener) {
                this._position.disconnect(this._positionListener);
                this._positionListener = undefined;
            }

            this._position = position;
            this._positionListener = this._position.connect("changed", () => {
                this.updateChild();
            });
        }
        else {
            this._position.value = position;
        }
    }

    show(monitor: number, position: PopupPosition) {
        this._window.monitor = monitor;

        this._window.set_visible(true);
        this.position = position;

        this.moveChild(this._position.value);
        
        if(this._onShow) {
            this._onShow(this);
        }
    }

    hide() {
        this._shouldClose = true;
        this._window.set_visible(false);

        if(this._onHide) {
            this._onHide(this);
        }
    }
};