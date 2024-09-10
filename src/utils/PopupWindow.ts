import GLib20 from "gi://GLib";
import Gtk from "gi://Gtk?version=3.0";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { WindowProps } from "types/widgets/window";

export type TPosition = {
    x: number,
    y: number
};


export interface PopupAnimationFunc {
    name: string,
    step(start: TPosition, end: TPosition, step: number): TPosition;
};

export const PopupAnimationFunctions = {
    "linear": {
        name: "linear",
        step(start, end, step) {
            const lerp = (a: number, b: number, alpha: number) => {
                return (1 - alpha) * a + alpha * b;
            };

            return {
                x: lerp(start.x, end.x, step),
                y: lerp(start.y, end.y, step)
            };
        }
    }
};

// TODO: refactor this whole cursed class
export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _displayPosition: TPosition;
    private _position: TPosition;

    private _window: Window<Gtk.Fixed, Attr>;
    private _fixed: Gtk.Fixed = Widget.Fixed({});

    private _childWrapper: Gtk.Widget;
    private _originalChild: Child;

    private _shouldClose: boolean;
    private _shouldUpdate: boolean;

    private _onShow?: (self: PopupWindow<Child, Attr>) => void;
    private _onHide?: (self: PopupWindow<Child, Attr>) => void;


    private _animationInterval?: GLib20.Source;
    private _animation?: {
        start: TPosition,
        duration: number,
        reverseDuration: number,
        updateRate: number,
        function: PopupAnimationFunc
    };

    private _centered: boolean;


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

        const computedPosition = { x: position.x, y: position.y };

        computedPosition.x = Math.min(geometry.width - allocation.width, computedPosition.x);
        computedPosition.x = Math.max(0, computedPosition.x);

        computedPosition.y = Math.max(allocation.height, computedPosition.y);
        computedPosition.y = Math.min(geometry.height, computedPosition.y);

        return computedPosition;
    }

    private moveChild(position: TPosition, doBoundsChecks: boolean = true) {
        const allocation = this.getChildAllocation();

        const computedPosition = doBoundsChecks ? this.getCorrectPosition(position) : position;

        this._shouldUpdate = false;

        this._fixed.move(this._childWrapper, computedPosition.x, computedPosition.y - (allocation.height));
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
    }: WindowProps<Child, Attr> = {}, toPopup: Child, animation: typeof this._animation, onShow?: typeof this._onShow, onHide?: typeof this._onHide) {
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

        this._centered = false;

        this._shouldClose = true;
        this._animation = animation;

        this._onShow = onShow;
        this._onHide = onHide;

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
                        this._displayPosition = {
                            x: this._position.x,
                            y: this._position.y
                        }

                        if(this._centered) {
                            const allocation = this.getChildAllocation();

                            this._displayPosition.x -= allocation.width / 2;
                            // this._displayPosition.y -= allocation.height / 2;
                        }

                        this._displayPosition = this.getCorrectPosition(this._displayPosition);
                        this.moveChild(this._displayPosition);
                    }
                    else {
                        this._shouldUpdate = true;
                    }
                });
            }
        });

        this._originalChild = toPopup;
        this._position = { x: 0, y: 0 };
        this._displayPosition = this._position;

        this._fixed.put(this._childWrapper, this._displayPosition.x, this._displayPosition.y);

        this._shouldUpdate = true;

        this.child = this._originalChild;
    }


    get window() { return this._window; }

    get animation() { return this._animation; }
    set animation(animation: typeof this._animation) { this._animation = animation; }

    get child() { return this._originalChild; }
    set child(child: Child) {
        this._originalChild = child;
        (this._childWrapper as any).child = this._originalChild;

        this.moveChild(this._displayPosition);
    }



    private runAnimation(start: TPosition, end: TPosition, duration: number, updateRate: number, func: PopupAnimationFunc, boundsCheck = true): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const interval = (1000 * duration) / updateRate;

            var pos = start;
            this.moveChild(start, false);

            if(this._animationInterval) {
                clearInterval(this._animationInterval);
            }

            var step = 0;
            this._animationInterval = setInterval(() => {
                step += interval / updateRate;

                // no animations i need have to go sideways so this is a hacky workaround
                start.x = boundsCheck ? this.getCorrectPosition(start).x : start.x;

                const tempEnd = boundsCheck ? this.getCorrectPosition(end) : end;
                pos = func.step(start, tempEnd, Math.min(1.0, step / interval))

                this.moveChild(pos, false);

                const posEqual = pos.x == tempEnd.x && pos.y == tempEnd.y;
                if(posEqual || !this.window.is_visible()) {
                    if(this._animationInterval) {
                        clearInterval(this._animationInterval);
                    }

                    resolve(posEqual);
                }
            }, interval);
        });
    }

    show(monitor: number, position: TPosition, centered: boolean = false) {
        this._centered = centered;
        this._window.monitor = monitor;

        this._window.set_visible(true);
        this._position = position;
        this._displayPosition = {
            x: this._position.x,
            y: this._position.y
        };

        const animation = this._animation;
        if(animation) {
            const allocation = this.getChildAllocation();

            var start = {
                x: animation.start.x,
                y: animation.start.y
            };

            if(this._centered) {
                start.x -= allocation.width / 2;
                // start.y -= allocation.height / 2;

                this._displayPosition.x -= allocation.width / 2;
                // this._displayPosition.y -= allocation.height / 2;
            }

            var end = {
                x: this._displayPosition.x,
                y: this._displayPosition.y
            };

            this.runAnimation(start, end, animation.duration, animation.updateRate, animation.function).then(() => {
                if(this._onShow) {
                    this._onShow(this);
                }
            });

            return;
        }

        this.moveChild(this._displayPosition);
        
        if(this._onShow) {
            this._onShow(this);
        }
    }

    hide() {
        this._shouldClose = true;

        const animation = this._animation;
        if(animation) {
            var start = this.getCorrectPosition(this._displayPosition);
            var end = {
                x: animation.start.x,
                y: animation.start.y
            };

            if(this._centered) {
                const allocation = this.getChildAllocation();

                end.x -= allocation.width / 2;
                // end.y -= allocation.height / 2;
            }

            end.x = this.getCorrectPosition(end).x;

            this.runAnimation(start, end, animation.reverseDuration, animation.updateRate, animation.function, false).then(() => {
                this._window.set_visible(false);

                if(this._onHide) {
                    this._onHide(this);
                }
            });

            return;
        }

        this._window.set_visible(false);

        if(this._onHide) {
            this._onHide(this);
        }
    }
};