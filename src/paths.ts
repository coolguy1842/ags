const TEMP_DIR_S = `/tmp/coolguy/ags`;

const STYLES_DIR_S = `${App.configDir}/styles`;
const OUT_CSS_DIR_S = `${TEMP_DIR_S}/css`;

export const paths = {
    TEMP_DIR: TEMP_DIR_S,
    OPTIONS_PATH: `${App.configDir}/options.json`,
    SOCKET_PATH: `${TEMP_DIR_S}/socket`,
    
    STYLES_DIR: STYLES_DIR_S,
    STYLES_MAIN: `${STYLES_DIR_S}/main.scss`,

    OUT_CSS_DIR: `${TEMP_DIR_S}/css`,
    OUT_SCSS_DYNAMIC: `${OUT_CSS_DIR_S}/dynamic.scss`,
    OUT_SCSS_IMPORTS: `${OUT_CSS_DIR_S}/imports.scss`,
    OUT_CSS_IMPORTS: `${OUT_CSS_DIR_S}/imports.css`
};