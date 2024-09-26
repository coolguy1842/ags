import { getOptions } from "src/options";
import { paths as pathsList } from "./paths";
import { OptionsHandler } from "./utils/handlers/optionsHandler";
import { StyleHandler } from "./utils/handlers/styleHandler";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { IReloadable } from "./interfaces/reloadable";
import { createAppLauncherPopupWindow } from "./popupWindows/appLauncher";
import { createTrayFavoritesPopupWindow } from "./popupWindows/systemTray";

import GLib from "gi://GLib";
import Gio from "gi://Gio";

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
    private _searchInput?: Variable<string>;

    private _optionsHandler?: OptionsHandler<ReturnType<typeof getOptions>>;
    private _styleHandler?: StyleHandler;

    private _communicationSocket?: Gio.Socket;
    private _communicationSocketCancellable?: Gio.Cancellable;

    private _popupWindows?: {
        AppLauncher: ReturnType<typeof createAppLauncherPopupWindow>,
        SystemTray: ReturnType<typeof createTrayFavoritesPopupWindow>
    };


    load(): void {
        if(this._loaded) return;

        this._paths = pathsList;
        
        this._searchInput = new Variable("");
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

        // probably not ideal but it doesnt seem to cleanup properly
        Utils.exec(`rm ${this._paths.SOCKET_PATH}`);
        
        this._communicationSocketCancellable = Gio.Cancellable.new();
        this._communicationSocket = Gio.Socket.new(Gio.SocketFamily.UNIX, Gio.SocketType.STREAM, Gio.SocketProtocol.DEFAULT);

        const addressPath = this._paths.SOCKET_PATH;
        const address = Gio.UnixSocketAddress.new(addressPath);
        
        this._communicationSocket.bind(address, true);
        this.communicationSocket?.listen();

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

        this._searchInput = undefined;
        this._clock = undefined;
        this._paths = undefined;


        this._communicationSocketCancellable?.cancel();

        this._communicationSocket?.close();
        this._communicationSocket = undefined;
        this._communicationSocketCancellable = undefined;

        this._loaded = false;
    }


    get paths() { return this._paths; }

    get clock() { return this._clock; }
    get searchInput() { return this._searchInput; }

    get optionsHandler() { return this._optionsHandler; }
    get styleHandler() { return this._styleHandler; }

    get popupWindows() { return this._popupWindows; }

    get communicationSocket() { return this._communicationSocket; }
};

export const globals = new Globals();