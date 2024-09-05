import { IOptions, getOptions } from "src/options";
import { paths } from "./paths";
import { OptionsHandler } from "./utils/handlers/optionsHandler";
import { StyleHandler } from "./utils/handlers/styleHandler";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import GLib from "gi://GLib";

interface IGlobals {
    paths: typeof paths;

    optionsHandler: OptionsHandler<IOptions>;
    styleHandler: StyleHandler;

    clock: Variable<GLib.DateTime>
};

export const globals: IGlobals = {
    paths: paths,

    optionsHandler: new OptionsHandler(getOptions()),
    styleHandler: new StyleHandler(),
    
    clock: new Variable(GLib.DateTime.new_now_local(), {
        poll: [1000, () => GLib.DateTime.new_now_local()],
    })
};