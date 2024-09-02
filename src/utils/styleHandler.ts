import DirectoryMonitor from "./dirMonitorUtil";
import { globals } from "./globals";

export class StyleHandler {
    _mainFile: string;

    _reloading: boolean;
    _monitor: DirectoryMonitor;

    constructor(mainFilePath: string) {
        this._mainFile = mainFilePath;

        this._reloading = false;

        this._monitor = new DirectoryMonitor(`${App.configDir}/styles`, true, true, () => {}, () => {
            if(!this._reloading) {
                this.reloadStyles();
            }
        });

        this._monitor.watch();
        this.reloadStyles();

        globals.options?.connect("changed", () => {
            this.reloadStyles();
        });
    }

    cleanup() {
        this._monitor.cleanup();
    }


    getDynamicSCSS() {
        const { bar } = globals.options!.options; 

        return `
            $bar-background-color: rgba($color: ${bar.background_color.value.slice(0, -2)}, $alpha: ${parseInt(bar.background_color.value.slice(-2), 16) / 255});
            $bar-icon-color: ${bar.icon_color.value};
        `;
    }

    async reloadStyles() {
        this._reloading = true;

        console.log("loading styles");
    
        try {
            await Utils.execAsync(`mkdir -p ${globals.paths.OUT_CSS_DIR}`);

            await Utils.writeFile(this.getDynamicSCSS(), globals.paths.OUT_SCSS_DYNAMIC);
            await Utils.writeFile([ globals.paths.OUT_SCSS_DYNAMIC, globals.paths.STYLES_MAIN ].map(file => `@import '${file}';`).join("\n"), globals.paths.OUT_SCSS_IMPORTS);

            await Utils.execAsync(`sassc ${globals.paths.OUT_SCSS_IMPORTS} ${globals.paths.OUT_CSS_IMPORTS}`);

            App.applyCss(globals.paths.OUT_CSS_IMPORTS, true);
        }
        catch(err) {
            console.log(err);
        }

        // min of 250ms extra for reloading css again
        setTimeout(() => { this._reloading = false; }, 250);
    }
};