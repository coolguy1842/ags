import { registerGObject } from "resource:///com/github/Aylur/ags/utils/gobject.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { option, Option } from "./option";

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

    constructor(options: OPTIONS, filePath: string) {
        super();

        this._options = options;
        this._filePath = filePath;

        this.loadPersistent();
        this.savePersistent();
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



    private async loadPersistent() {
        const text = Utils.readFile(this._filePath);
        if(text.length <= 0) {
            this.savePersistent();
            return;
        }

        let json: JSONOptionsType;
        try {
            json = JSON.parse(text) as JSONOptionsType;
        }
        catch(err) {
            console.log(`error parsing persistent config data`);
            console.log(err);

            this.savePersistent();
            return;
        }

        const loadJSON = (baseJSON: JSONOptionsType, json: JSONOptionsType, keyPath: string[]) => {
            for(const key in json) {
                const value = json[key];
    
                switch(typeof value) {
                case "string":
                    const path = keyPath.length > 0 ? `["${keyPath.join("\"][\"")}"]["${key}"]` : `["${key}"]`;
                    
                    // cant be bothered doing the proper way so eval it is
                    var val: Option<any> | undefined = eval(`this._options${path}`);
                    if(val == undefined || !val.persistent) continue;
                    
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
    }

    private async savePersistent() {
        try {
            Utils.writeFileSync(JSON.stringify(this.filterPersistentOptions(this.options), null, 4), this._filePath);
        }
        catch(err) {
            console.log(err);
        }
    }
};