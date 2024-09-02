import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Option } from "./option";
import Gio from "gi://Gio";

export type OptionsType = {
    [key: string]: Option<any> | OptionsType;
};

type JSONOptionsType = {
    [key: string]: any | JSONOptionsType;
};


export class OptionsHandler<OPTIONS extends OptionsType> extends Service {
    static {
        registerGObject(
            this,
            {
                signals: {
                    "option-changed": ['string'],
                    'options-reloaded': []
                },
                properties: {
                    "options": [ "jsobject", "rw" ]
                },
                typename: `Ags_OptionsHandler_${Date.now()}`
            }
        );
    }

    private _options: OPTIONS;
    private _filePath: string;

    private _fileMonitor: any;
    private _reloadingOptions: boolean;

    constructor(options: OPTIONS, filePath: string) {
        super();

        this._options = options;
        this._filePath = filePath;

        this._reloadingOptions = false;

        this.loadPersistent();
        this.savePersistent();

        this._fileMonitor = Utils.monitorFile(this._filePath, () => {
            if(this._reloadingOptions) return;

            console.log("reloading options");
            this.loadPersistent();
        }, { flags: Gio.FileMonitorFlags.NONE, recursive: false });
    }

    cleanup() {
        if(this._fileMonitor != null) {
            this._fileMonitor.cancel();
            this._fileMonitor = null;
        }
    }



    getOption<T extends keyof OPTIONS>(option: T): OPTIONS[T] {
        return this.options[option];
    }

    get options() { return this._options; }
    set options(options: OPTIONS) {
        this._options = options;
    }


    // TODO: this whole bit of code is ugly and needs a lot of refactoring
    private filterPersistentOptions(options: OptionsType) {
        var out = {};

        for(const key in options) {
            const value = options[key];

            if(value instanceof Option) {
                if(!value.persistent) continue;
                out[key] = value;

                continue;
            }

            const values = this.filterPersistentOptions(value);
            if(Object.keys(values).length <= 0) continue;

            out[key] = values;
        }

        return out;
    }

    private loadPersistent() {
        this._reloadingOptions = true;

        const text = Utils.readFile(this._filePath);
        if(text.length <= 0) {
            this.savePersistent();

            this._reloadingOptions = false;
            return;
        }

        let json: JSONOptionsType;
        try {
            json = JSON.parse(text) as JSONOptionsType;
        }
        catch(err) {
            console.log(`error parsing persistent config data`);
            this.savePersistent();

            this._reloadingOptions = false;
            return;
        }

        const loadJSON = (baseJSON: JSONOptionsType, json: JSONOptionsType, keyPath: string[]) => {
            for(const key in json) {
                const value = json[key];
    
                switch(typeof value) {
                case "string":
                    const path = keyPath.length > 0 ? `["${keyPath.join("\"][\"")}"]["${key}"]` : `["${key}"]`;
                    
                    // cant be bothered doing the proper way so eval it is
                    var val: Option<any> | undefined;
                    try {
                        val = eval(`this._options${path}`);
                        if(val == undefined || !val.persistent) continue;
                    }
                    catch(err) {
                        continue;
                    }
                    
                    var valJSON;
                    try {
                        valJSON = JSON.parse(value);
                    }
                    catch(err) {
                        continue;
                    }

                    if(!("option" in valJSON)) {
                        continue;
                    }

                    try {
                        eval(`this._options${path} = option(valJSON["option"])`);
                    }
                    catch(err) {
                        console.log(err);
                    }

                    break;
                case "object":
                    loadJSON(baseJSON, value, [ ...keyPath, key ]);
                    break;
                }
            }
        }

        loadJSON(json, json, []);

        this.emit("changed");
        this.emit("options-reloaded");

        this.notify("options");

        // add 250ms delay before options can reload again
        setTimeout(() => { this._reloadingOptions = false; }, 250);
    }

    private savePersistent() {
        var wasReloading = this._reloadingOptions;
        this._reloadingOptions = true;

        try {
            Utils.writeFileSync(JSON.stringify(this.filterPersistentOptions(this.options), null, 4), this._filePath);
        }
        catch(err) {
            console.log(err);
        }

        this._reloadingOptions = wasReloading;
    }
};