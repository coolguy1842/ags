import { IOptions, options } from "src/options";
import { OptionsHandler } from "./handlers/optionsHandler";
import { StyleHandler } from "./handlers/styleHandler";

interface IPaths {
    TEMP_DIR: string;

    OPTIONS_PATH: string;

    STYLES_DIR: string;
    STYLES_MAIN: string;

    OUT_CSS_DIR: string;

    OUT_SCSS_DYNAMIC: string;
    OUT_SCSS_IMPORTS: string;

    OUT_CSS_IMPORTS: string;
}

interface IGlobals {
    paths: IPaths;

    optionsHandler: OptionsHandler<IOptions>;
    styleHandler: StyleHandler;
};

const TEMP_DIR = `/tmp/coolguy/ags`;
const OPTIONS_PATH = `${App.configDir}/options.json`;

const STYLES_DIR = `${App.configDir}/styles`;
const OUT_CSS_DIR = `${TEMP_DIR}/css`;

const paths: IPaths = {
    TEMP_DIR: TEMP_DIR,
    OPTIONS_PATH: OPTIONS_PATH,
    STYLES_DIR: STYLES_DIR,
    STYLES_MAIN: `${STYLES_DIR}/main.scss`,
    OUT_CSS_DIR: `${TEMP_DIR}/css`,
    OUT_SCSS_DYNAMIC: `${OUT_CSS_DIR}/dynamic.scss`,
    OUT_SCSS_IMPORTS: `${OUT_CSS_DIR}/imports.scss`,
    OUT_CSS_IMPORTS: `${OUT_CSS_DIR}/imports.css`
};

export const globals: IGlobals = {
    paths: paths,

    optionsHandler: new OptionsHandler(options),
    styleHandler: new StyleHandler()
};