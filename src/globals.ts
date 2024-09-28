import { getOptions } from "src/options";
import { paths as pathsList } from "./paths";
import { OptionsHandler } from "./utils/handlers/optionsHandler";
import { StyleHandler } from "./utils/handlers/styleHandler";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { IReloadable } from "./interfaces/reloadable";
import { createAppLauncherPopupWindow, toggleAppLauncher } from "./popupWindows/appLauncher";
import { createTrayFavoritesPopupWindow } from "./popupWindows/systemTray";

import GLib from "gi://GLib";
import Gio from "gi://Gio";
import GObject from "types/@girs/gobject-2.0/gobject-2.0";
import { getCurrentMonitor } from "./utils/utils";
import Gdk from "gi://Gdk";

export class Globals implements IReloadable {
    private _loaded: boolean = false;

    get loaded() { return this._loaded }
    set loaded(loaded: boolean) {
        if(this._loaded == loaded) return;
        
        if(loaded) this.load();
        else this.cleanup();
    } 

    private _monitorLookups?: { [name: string]: number };
    private _paths?: typeof pathsList;

    private _clock?: Variable<GLib.DateTime>;
    private _searchInput?: Variable<string>;

    private _optionsHandler?: OptionsHandler<ReturnType<typeof getOptions>>;
    private _styleHandler?: StyleHandler;

    private _communicationSocketService?: Gio.SocketService;
    private _communicationSocket?: Gio.Socket;
    private _communicationSocketCancellable?: Gio.Cancellable;

    private _popupWindows?: {
        AppLauncher: ReturnType<typeof createAppLauncherPopupWindow>,
        SystemTray: ReturnType<typeof createTrayFavoritesPopupWindow>
    };

    private _close_socket(path: string) {
        const file = Gio.File.new_for_path(path);

        if(file.query_exists(null)) {
            file.delete(null);
        }
    }

    
    loadMonitorLookups() {
        // not fully tested, allows for monitors to be added and removed and shows on the right monitor properly
        const screen = Gdk.Screen.get_default();
        if(screen == undefined) {
            this._monitorLookups = {};
            return;
        }

        const monitors = screen.get_n_monitors();

        const monitorLookups: { [ name: string ]: number } = {};
        for(var id = 0; id < monitors; id++) {
            const name = screen.get_monitor_plug_name(id) ?? undefined;

            if(name) {
                monitorLookups[name] = id;
            }
        }

        this._monitorLookups =  monitorLookups;
    }


    load(): void {
        if(this._loaded) return;

        this.loadMonitorLookups();
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
        this._close_socket(this._paths.SOCKET_PATH);
        
        const addressPath = this._paths.SOCKET_PATH;
        const address = Gio.UnixSocketAddress.new(addressPath);

        this._communicationSocketService = Gio.SocketService.new();
        this._communicationSocketService.add_address(address, Gio.SocketType.STREAM, Gio.SocketProtocol.DEFAULT, null);

        this._communicationSocketService.connect("incoming", (socket_service: Gio.SocketService, connection: Gio.SocketConnection, channel: GObject.Object | null) => {
            const inStream = connection.get_input_stream();
            const message = inStream.read_bytes(128, null);

            const command = new TextDecoder().decode(message.toArray());

            switch(command) {
            case "app_launcher":
                if(!this.popupWindows?.AppLauncher) break;

                toggleAppLauncher(this.popupWindows.AppLauncher, getCurrentMonitor());
                break;
            }
            
            connection.close(null);
        })

        this._communicationSocketService.start();
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

        this._communicationSocketService = undefined;
        if(this._paths?.SOCKET_PATH) {
            this._close_socket(this._paths.SOCKET_PATH);
        }

        this._paths = undefined;
        this._monitorLookups = undefined;

        this._loaded = false;
    }


    get monitorLookups() { return this._monitorLookups; }
    get paths() { return this._paths; }

    get clock() { return this._clock; }
    get searchInput() { return this._searchInput; }

    get optionsHandler() { return this._optionsHandler; }
    get styleHandler() { return this._styleHandler; }

    get popupWindows() { return this._popupWindows; }

    get communicationSocket() { return this._communicationSocket; }
};

export const globals = new Globals();