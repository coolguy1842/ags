import { IOptions, options } from "src/options";
import { paths } from "./paths";
import { OptionsHandler } from "./utils/handlers/optionsHandler";
import { StyleHandler } from "./utils/handlers/styleHandler";

interface IGlobals {
    paths: typeof paths;

    optionsHandler: OptionsHandler<IOptions>;
    styleHandler: StyleHandler;
};

export const globals: IGlobals = {
    paths: paths,

    optionsHandler: new OptionsHandler(options),
    styleHandler: new StyleHandler()
};