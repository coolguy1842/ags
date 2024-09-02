import { Option, option } from "./option";
import { OptionsHandler, OptionsType } from "./optionsHandler";
import { StyleHandler } from "./styleHandler";


type IOptionsLayout = {
    bar: {
        background_color: Option<string>,
        icon_color: Option<string>
    };
};

interface IGlobals {
    paths: {
        TEMP_DIR: string;

        OPTIONS_PATH: string;


        STYLES_DIR: string;
        STYLES_MAIN: string;

        OUT_CSS_DIR: string;

        OUT_SCSS_DYNAMIC: string;
        OUT_SCSS_IMPORTS: string;

        OUT_CSS_IMPORTS: string;
    };


    defaultOptions: IOptionsLayout;

    options?: OptionsHandler<IOptionsLayout>;
    styleHandler?: StyleHandler;
};

const TEMP_DIR = `/tmp/coolguy/ags`;
const STYLES_DIR = `${App.configDir}/styles`;
const OUT_CSS_DIR = `${TEMP_DIR}/css`;

export const globals: IGlobals = {
    paths: {
        TEMP_DIR: TEMP_DIR,
        OPTIONS_PATH: `${App.configDir}/options.json`,
        STYLES_DIR: STYLES_DIR,
        STYLES_MAIN: `${STYLES_DIR}/main.scss`,
        OUT_CSS_DIR: `${TEMP_DIR}/css`,
        OUT_SCSS_DYNAMIC: `${OUT_CSS_DIR}/dynamic.scss`,
        OUT_SCSS_IMPORTS: `${OUT_CSS_DIR}/imports.scss`,
        OUT_CSS_IMPORTS: `${OUT_CSS_DIR}/imports.css`
    },
    defaultOptions: {
        bar: {
            background_color: option("#ff0000ff"),
            icon_color: option("#5D93B0")
        }
    }
};