import { IOptions, getOptions } from "src/options";
import { paths as pathsList } from "./paths";
import { OptionsHandler } from "./utils/handlers/optionsHandler";
import { StyleHandler } from "./utils/handlers/styleHandler";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import GLib from "gi://GLib";
import { IReloadable } from "./interfaces/reloadable";
import { PopupWindow } from "./utils/classes/PopupWindow";
import { createAppLauncherPopupWindow } from "./popupWindows/appLauncher";
import { createTrayFavoritesPopupWindow } from "./popupWindows/systemTray";

export class Globals implements IReloadable {
    private _loaded: boolean = false;

    get loaded() { return this._loaded }
    set loaded(loaded: boolean) {
        if(this._loaded == loaded) return;
        
        if(loaded) this.load();
        else this.cleanup();
    } 

    private _paths?: typeof pathsList;

    private _clock?: Variable<GLib.DateTime>;

    private _optionsHandler?: OptionsHandler<ReturnType<typeof getOptions>>;
    private _styleHandler?: StyleHandler;

    private _popupWindows?: {
        AppLauncher: ReturnType<typeof createAppLauncherPopupWindow>,
        SystemTray: ReturnType<typeof createTrayFavoritesPopupWindow>
    };


    load(): void {
        if(this._loaded) return;

        this._paths = pathsList;

        this._clock = new Variable(GLib.DateTime.new_now_local(), {
            poll: [1000, () => GLib.DateTime.new_now_local()],
        });

        this._optionsHandler = new OptionsHandler(getOptions());
        this._optionsHandler.load();

        this._styleHandler = new StyleHandler();
        this._styleHandler.load();

        this._popupWindows = {
            AppLauncher: createAppLauncherPopupWindow(),
            SystemTray: createTrayFavoritesPopupWindow()
        };

        for(const window of Object.values(this._popupWindows)) {
            window.load();
        }

        this._loaded = true;
    }

    cleanup(): void {
        if(!this._loaded) return;
        
        for(const window of Object.values(this._popupWindows ?? {})) {
            window.cleanup();
        }

        this._popupWindows = undefined;

        this._styleHandler?.cleanup();
        this._optionsHandler?.cleanup();

        this._clock = undefined;
        this._paths = undefined;

        this._loaded = false;
    }


    get paths() { return this._paths; }
    get clock() { return this._clock; }

    get optionsHandler() { return this._optionsHandler; }
    get styleHandler() { return this._styleHandler; }

    get popupWindows() { return this._popupWindows; }
};

export const globals = new Globals();