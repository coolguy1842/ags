import Gtk from "gi://Gtk?version=3.0";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { EventBox } from "resource:///com/github/Aylur/ags/widgets/eventbox.js";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { Rectangle } from "types/@girs/gdk-3.0/gdk-3.0.cjs";
import { Allocation } from "types/@girs/gtk-3.0/gtk-3.0.cjs";
import { WindowProps } from "types/widgets/window";
import { PopupAnimation, TPosition } from "./PopupAnimation";
import { sleep } from "../utils";
import Widgets from "../widgets/widgets";

export type PopupPosition = TPosition | Variable<TPosition>;
export type AnimationOptions = {
    animation: PopupAnimation;
    startPosition: PopupPosition;

    duration: number;
    refreshRate: number;
};

export class PopupWindow<Child extends Gtk.Widget, Attr> {
    private _position: Variable<TPosition>;
    private _lastPosition: TPosition;
    private _lastDisplayPosition: TPosition;
    
    private _positionListener?: number;

    private _window: Window<Gtk.Layout, Attr>;
    private _layout: Gtk.Layout;

    private _childWrapper: EventBox<Gtk.Widget, unknown>;
    private _child: Child;

    private _shouldClose: boolean;

    private _animationOptions?: AnimationOptions;
    private _animating: boolean;

    private _onShow?: (self: PopupWindow<Child, Attr>) => void;
    private _onHide?: (self: PopupWindow<Child, Attr>) => void;

    private _wrapperAllocation: Variable<Allocation>;
    private _screenBounds: Variable<Rectangle>;


    get window() { return this._window; }

    get childAllocation() { return this._wrapperAllocation; }
    get screenBounds() { return this._screenBounds; }
    get animationOptions() { return this._animationOptions; }

    get child() { return this._child; }
    set child(child: Child) {
        this._child = child;
        (this._childWrapper as any).child = this._child;

        this.moveChild(this._position.value);
    }

    get onShow() { return this._onShow; }
    set onShow(onShow: typeof this._onShow) { this._onShow = onShow; }

    get onHide() { return this._onHide; }
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
    }: WindowProps<Child, Attr> = {}, child: Child, animationOptions?: AnimationOptions, onShow?: typeof this._onShow, onHide?: typeof this._onHide) {
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
            child: Widgets.Layout({}),
            ...params
        } as WindowProps<Gtk.Layout, Attr>);

        this._shouldClose = true;
        this._animating = false;

        this._animationOptions = animationOptions;

        this._onShow = onShow;
        this._onHide = onHide;

        this._window.keybind("Escape", () => {
            if(!this._window.is_visible()) {
                return;
            }

            this.hide();
        });

        this.window.keybind("Insert", () => {
            this._animating = false;
        })

        this._window.on("button-press-event", (self, args) => {
            if(this._shouldClose) {
                this.hide();
                return;
            }

            this._shouldClose = true;
        });

        this._layout = this._window.child;
        this._childWrapper = Widget.EventBox({
            css: "all: unset;",
            visible: true,
            setup: (self) => {
                self.connect("button-press-event", (args) => {
                    this._shouldClose = false;
                });
            }
        });

        this._layout.put(this._childWrapper, 0, 0);


        const checkWrapper = () => {
            const visible = this._window.is_visible();
            if(!visible) {
                this._window.set_visible(true);
            }

            const allocation = this._childWrapper.get_allocation();
            if(!visible) {
                this._window.set_visible(false);
            }

            return allocation;
        }

        this._wrapperAllocation = new Variable({ x: 0, y: 0, width: 0, height: 0 } as Allocation, {
            poll: [
                100, () => {
                    return checkWrapper();
                }
            ]
        });
        this._childWrapper.connect("draw", () => {
            this._wrapperAllocation.value = checkWrapper();
        })

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

                    return this.getScreenBounds();
                }
            ]
        });

        this._position = new Variable({ x: 0, y: 0 });
        this._lastPosition = this._position.value;
        this._lastDisplayPosition = this._position.value;
        
        this._child = child
        this.child = this._child;

        this._positionListener = this._position.connect("changed", () => this.updateChild());
        this._wrapperAllocation.connect("changed", () => this.updateChild());
        this._screenBounds.connect("changed", () => this.updateChild());
    }

    show(monitor: number, position: PopupPosition) {
        this._window.monitor = monitor;
        
        this._window.set_visible(true);
        this.updateScreenBounds();
        
        this.position = position;

        if(this._animationOptions) {
            this.animate(
                this._animationOptions.startPosition,
                position,
                this._animationOptions.duration,
                this._animationOptions.refreshRate,
                this._animationOptions.animation.func
            ).then((val) => {
                if(!val) return;

                if(this._onShow) {
                    this._onShow(this);
                }
            });

            return;
        }

        this.updateChild();
        
        if(this._onShow) {
            this._onShow(this);
        }
    }

    hide() {
        this._shouldClose = true;

        if(this._animationOptions) {
            this.animate(
                this._lastPosition,
                this._animationOptions.startPosition,
                this._animationOptions.duration,
                this._animationOptions.refreshRate,
                this._animationOptions.animation.func
            ).then((val) => {
                if(!val) return;

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


    async animate(
        start: PopupPosition,
        end: PopupPosition,
        duration: number,
        updateFrequency: number,
        func: PopupAnimation["func"]
    ): Promise<boolean> {
        if(this._animating) return false;

        this._animating = true;

        const interval = (1000 * duration) / updateFrequency;
        const addStep = 1 / updateFrequency;

        let step = 0;

        while(this._animating && this._window.is_visible()) {
            step = Math.min(1.0, step + addStep);

            const startPosition = start instanceof Variable ? start.value : start;
            const endPosition = end instanceof Variable ? end.value : end;

            const position = func(startPosition, endPosition, step);
            this.moveChild(position);

            if(position.x == endPosition.x && position.y == endPosition.y) {
                this._animating = false;
                return true;
            }

            await sleep(interval);
        }

        this._animating = false;
        return false;
    }

    cancelAnimation() {
        if(!this._animating) {
            return;
        }
    }


    private updateChild() {
        if(!this._window.is_visible() || this._animating) {
            return;
        }

        this.moveChild(this._position.value);
    }

    private moveChild(position: TPosition) {
        const displayPosition = {
            x: Math.floor(position.x),
            y: Math.floor(position.y)
        };

        if(this._lastPosition.x == displayPosition.x && this._lastPosition.y == displayPosition.y) {
            return;
        }

        this._lastPosition = {
            x: displayPosition.x,
            y: displayPosition.y,
        };

        displayPosition.y = this._screenBounds.value.height - displayPosition.y;
        this._lastDisplayPosition = {
            x: displayPosition.x,
            y: displayPosition.y
        };
        
        this._layout.move(this._childWrapper, displayPosition.x, displayPosition.y);
    }


    private getScreenBounds() {
        const screen = this._window.screen;

        if(this._window.monitor >= 0) {
            return screen.get_monitor_geometry(this._window.monitor)
        }

        return screen.get_monitor_geometry(screen.get_monitor_at_window(this._window.window));
    }

    private updateScreenBounds() {
        const bounds = this.getScreenBounds();
        this._screenBounds.value = bounds;

        return bounds;
    }
};