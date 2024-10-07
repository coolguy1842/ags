import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { EventBox } from "resource:///com/github/Aylur/ags/widgets/eventbox.js";
import { Window } from "resource:///com/github/Aylur/ags/widgets/window.js";
import { Rectangle } from "types/@girs/gdk-3.0/gdk-3.0.cjs";
import { WindowProps } from "types/widgets/window";
import { PopupAnimation, TPosition } from "./PopupAnimation";
import { sleep } from "../utils";
import { IReloadable } from "src/interfaces/reloadable";

import Gtk from "gi://Gtk?version=3.0";
import Widgets from "../widgets/widgets";


export type PopupPosition = TPosition | Variable<TPosition>;
export type AnimationOptions = {
    animation: PopupAnimation;
    
    duration: number;
    refreshRate: number;
};

export class PopupWindow<Child extends Gtk.Widget, Attr> implements IReloadable {
    private _onLoad?: (self: PopupWindow<Child, Attr>) => void;
    private _onCleanup?: (self: PopupWindow<Child, Attr>) => void;
    private _loaded: boolean;

    private _position: Variable<TPosition>;
    private _lastPosition: TPosition;

    private _lastShowStartPosition: PopupPosition;


    private _activeListeners: { variable: any, listener: number }[];

    
    private _positionListener?: number;

    private _window: Window<Gtk.Layout, Attr>;
    private _layout: Gtk.Layout;

    private _childWrapper: EventBox<Gtk.Widget, unknown>;
    private _child: Child;

    private _shouldClose: boolean;

    private _animationOptions?: AnimationOptions;

    private _onShow?: (self: PopupWindow<Child, Attr>) => void;
    private _onHide?: (self: PopupWindow<Child, Attr>) => void;

    private _wrapperAllocation: Variable<Rectangle>;
    private _screenBounds: Variable<Rectangle>;

    private _hiding = false;

    get loaded() { return this._loaded; }
    get window() { return this._window; }

    get childAllocation() { return this._wrapperAllocation; }
    get screenBounds() { return this._screenBounds; }
    get animationOptions() { return this._animationOptions; }

    get child() { return this._child; }
    set child(child: Child) {
        this._child = child;
        (this._childWrapper as any).child = this._child;

        this.updateChild();
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


    private _getWrapperAllocation() {
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
    }:  WindowProps<Child, Attr> = {},
        child: Child,
        animationOptions?: AnimationOptions,
        callbacks?: {
            onShow?: (self: PopupWindow<Child, Attr>) => void,
            onHide?: (self: PopupWindow<Child, Attr>) => void,
            onLoad?: (self: PopupWindow<Child, Attr>) => void,
            onCleanup?: (self: PopupWindow<Child, Attr>) => void
        }) {
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

        this._animationOptions = animationOptions;

        this._onLoad = callbacks?.onLoad;
        this._onCleanup = callbacks?.onCleanup;

        this._onShow = callbacks?.onShow;
        this._onHide = callbacks?.onHide;

        this._window.keybind("Escape", () => {
            if(!this._window.is_visible()) {
                return;
            }

            this.hide(this._lastShowStartPosition);
        });

        this.window.keybind("Insert", () => {
            this.cancelAnimation();
        })

        this._window.on("button-press-event", (self, event) => {
            if(this._shouldClose) {
                this.hide(this._lastShowStartPosition);

                // prevent double firing
                this._shouldClose = false;
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
        this._child = child;

        this._wrapperAllocation = new Variable(this._getWrapperAllocation(), { poll: [ 100, () => this._getWrapperAllocation() ] });
        this._wrapperAllocation.stopPoll();

        this._screenBounds = new Variable(this.getScreenBounds(), { poll: [ 1000, () => this.getScreenBounds() ] });
        this._screenBounds.stopPoll();

        this._position = new Variable({ x: 0, y: 0 });
        this._lastPosition = this._position.value;
        this._lastShowStartPosition = { x: 0, y: 0 };

        this._activeListeners = [];
        this._loaded = false;
    }

    load(): void {
        if(this._loaded) return;

        this._wrapperAllocation.startPoll();
        this._activeListeners.push({
            variable: this._childWrapper,
            listener: this._childWrapper.connect("draw", () => {
                this._wrapperAllocation.value = this._getWrapperAllocation();
            })
        })

        this._position = new Variable({ x: 0, y: 0 });
        this._lastPosition = this._position.value;

        this._activeListeners.push({ variable: this._position,          listener: this._position         .connect("changed", () => this.updateChild()) });
        this._activeListeners.push({ variable: this._wrapperAllocation, listener: this._wrapperAllocation.connect("changed", () => this.updateChild()) });
        this._activeListeners.push({ variable: this._screenBounds,      listener: this._screenBounds     .connect("changed", () => this.updateChild()) });

        this.child = this._child;

        this._loaded = true;
        this._hiding = false;

        this._animationLooping = false;
        this._currentAnimationInfo = undefined;

        if(this._onLoad) {
            this._onLoad(this);
        }
    }

    cleanup(): void {
        if(!this._loaded) return;

        this.cancelAnimation();
        if(this.onHide) {
            this.onHide(this);
        }

        if(this._onCleanup) {
            this._onCleanup(this);
        }

        for(const listener of this._activeListeners) {
            listener.variable.disconnect(listener.listener);
        }

        this._loaded = false;
    }


    show(monitor: number, start: PopupPosition, end: PopupPosition) {
        if(!this._loaded) return;

        this._window.monitor = monitor;
        
        this._window.set_visible(true);
        this.updateScreenBounds();
        
        this.position = end;
        this._lastShowStartPosition = start;

        if(this._animationOptions) {
            this.animate(
                "show",
                start,
                end,
                this._animationOptions.duration,
                this._animationOptions.refreshRate,
                this._animationOptions.animation.func,
                () => {
                    if(this._onShow) {
                        this._onShow(this);
                    }
                },
                () => {}
            );

            return;
        }

        this.updateChild();
        
        if(this._onShow) {
            this._onShow(this);
        }
    }

    hide(endPosition: PopupPosition = this._lastShowStartPosition) {
        if(!this._loaded || this._hiding) return;
        this._hiding = true;
        this.window.click_through = true;

        if(this._animationOptions) {
            this.animate(
                "hide",
                { x: this._lastPosition.x, y: this._lastPosition.y },
                endPosition,
                this._animationOptions.duration,
                this._animationOptions.refreshRate,
                this._animationOptions.animation.func,
                () => {
                    this.window.click_through = false;

                    this._hiding = false;
                    this._window.set_visible(false);
                    
                    if(this._onHide) {
                        this._onHide(this);
                    }
                },
                () => {
                    this.window.click_through = false;
                    
                    this._hiding = false;
                }
            );

            return;
        }
        
        this._window.set_visible(false);

        if(this._onHide) {
            this._onHide(this);
        }
        
        this.window.click_through = false;
        this._hiding = false;
    }

    private _currentAnimationInfo?: {
        name: string,

        start: PopupPosition,
        end: PopupPosition,
        
        duration: number,
        updateFrequency: number,
        
        alpha: number,
        addAlpha: number,

        func: PopupAnimation["func"],

        onComplete: () => void,
        onCancel: () => void
    };

    private _animationLooping: boolean = false;
    async runAnimationLoop() {
        if(this._animationLooping) return;

        this._animationLooping = true;
        while(this._animationLooping) {
            if(!this._currentAnimationInfo) {
                break;
            }

            let { name, duration, updateFrequency, start, end, alpha, addAlpha, onComplete } = this._currentAnimationInfo;
            if(alpha > 1.0) {
                onComplete();
                
                this._currentAnimationInfo.onCancel = () => {};
                this.cancelAnimation();

                break;
            }


            const startPosition = start instanceof Variable ? start.value : start;
            const endPosition = end instanceof Variable ? end.value : end;

            const position = this._currentAnimationInfo.func(startPosition, endPosition, Math.min(alpha, 1.0));
            this.moveChild(position);

            this._currentAnimationInfo.alpha += addAlpha;
            await sleep((1000 * duration) / updateFrequency);
        }

        this._animationLooping = false;        
    }

    async animate(
        name: string,
        animationStart: PopupPosition,
        animationEnd: PopupPosition,
        animationDuration: number,
        animationUpdateFrequency: number,
        func: PopupAnimation["func"],
        onComplete: () => void,
        onCancel: () => void
    ) {
        if(!this._loaded) return;
        if(this._animationLooping) {
            this.cancelAnimation();
        }

        this._currentAnimationInfo = {
            name,

            start: animationStart,
            end: animationEnd,
            
            duration: animationDuration,
            updateFrequency: animationUpdateFrequency,

            alpha: 0,
            addAlpha: 1 / animationUpdateFrequency,

            func,

            onComplete,
            onCancel
        };

        this.runAnimationLoop();
    }

    cancelAnimation() {
        if(!this._loaded) return;

        if(this._currentAnimationInfo) {
            this._currentAnimationInfo.onCancel();
        }

        this._animationLooping = false;
        this._currentAnimationInfo = undefined;
    }

    private updateChild() {
        if(!this._loaded || !this._window.is_visible()) {
            return;
        }

        if(this._currentAnimationInfo) {
            if(this._currentAnimationInfo.name != "moving") {
                return;
            }
        }

        const pos = this._position instanceof Variable ? this._position.value : this._position;
        if(Math.abs(this._lastPosition.x - pos.x) <= 1 && Math.abs(this._lastPosition.y - pos.y) <= 1) {
            return;
        }

        if(this._animationOptions) {
            const { animation, duration, refreshRate } = this._animationOptions;
            this.animate("moving", { x: this._lastPosition.x, y: this._lastPosition.y }, this._position, duration / 2, refreshRate, animation.func, () => {}, () => {});

            return;
        }
        
        this.moveChild(this._position.value);
    }

    private moveChild(position: TPosition) {
        if(!this._loaded) return;
        
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