import Gtk from "gi://Gtk?version=3.0";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { WindowProps } from "types/widgets/window";

export type TPosition = {
    x: number,
    y: number
};

export interface PopupAnimation {
    name: string,
    animate(start: TPosition, end: TPosition, step: number): TPosition;
};

export const PopupAnimations: PopupAnimation[] = [
    {
        name: "linear",
        animate(start: TPosition, end: TPosition, step: number) {
            const lerp = (a: number, b: number, alpha: number) => {
                return a + alpha * (b - a);
            };

            return {
                x: lerp(start.x, end.x, step),
                y: lerp(start.y, end.y, step)
            };
        }
    }
];

export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _displayPosition: TPosition;

    private _window: Window<Gtk.Fixed, Attr>;
    private _fixed: Gtk.Fixed = Widget.Fixed({});

    private _childWrapper: Gtk.Widget;
    private _originalChild: Child;

    private _shouldClose: boolean;
    private _shouldUpdate: boolean;


    private getChildAllocation() {
        const visible = this.window.is_visible();
        this.window.set_visible(true);

        const allocation = this._childWrapper.get_allocation();

        this.window.set_visible(visible);
        return allocation;
    }


    private getCorrectPosition(position: TPosition) {
        const allocation = this.getChildAllocation();
        const geometry = this._window.screen.get_monitor_geometry(this._window.monitor);

        const computedPosition = { x: this._displayPosition.x, y: this._displayPosition.y };

        computedPosition.x = Math.min(geometry.width - allocation.width, computedPosition.x);
        computedPosition.x = Math.max(0, computedPosition.x);

        computedPosition.y = Math.max(allocation.height, computedPosition.y);
        computedPosition.y = Math.min(geometry.height, computedPosition.y);

        return computedPosition;
    }

    private moveChild(position: TPosition, doBoundsChecks: boolean = true) {
        this._displayPosition = position;

        const allocation = this.getChildAllocation();
        const computedPosition = this.getCorrectPosition(position);

        this._shouldUpdate = false;

        this._fixed.move(this._childWrapper, computedPosition.x, computedPosition.y - (allocation.height));
    }

    constructor({
        anchor = [ "top", "bottom", "left", "right" ],
        exclusive,
        exclusivity = 'ignore',
        focusable = false,
        keymode = 'exclusive',
        layer = 'overlay',
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
            css: "all: unset;",
            visible: true,
            setup: (self) => {
                self.connect("button-press-event", (args) => {
                    this._shouldClose = false;
                });

                self.connect("draw", () => {
                    if(this._shouldUpdate) {
                        this.moveChild(this._displayPosition);
                    }
                    else {
                        this._shouldUpdate = true;
                    }
                });
            }
        });

        this._originalChild = toPopup;
        this._displayPosition = { x: 0, y: 0 };
        this._fixed.put(this._childWrapper, this._displayPosition.x, this._displayPosition.y);

        this._shouldUpdate = true;

        this.child = this._originalChild;
    }


    get window() { return this._window; }

    get child() { return this._originalChild; }
    set child(child: Child) {
        this._originalChild = child;
        (this._childWrapper as any).child = this._originalChild;

        this.moveChild(this._displayPosition);
    }


    show(monitor: number, position: TPosition) {
        this._window.monitor = monitor;

        this._window.set_visible(true);
        this._displayPosition = position;

        this.moveChild(this._displayPosition);
    }

    hide() {
        this._shouldClose = true;
        this._window.set_visible(false);
    }
};