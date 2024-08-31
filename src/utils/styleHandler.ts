import DirectoryMonitor from "./dirMonitorUtil";
import { OUT_CSS_DIR, OUT_CSS_IMPORTS, OUT_SCSS_DYNAMIC, OUT_SCSS_IMPORTS, STYLES_MAIN } from "./globals";

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
    }

    cleanup() {
        this._monitor.cleanup();
    }


    getDynamicSCSS() {
        return `
            $bar-background-color: rgba($color: #000000, $alpha: 0.68);
        `;
    }

    async reloadStyles() {
        this._reloading = true;

        console.log("loading styles");
    
        try {
            await Utils.execAsync(`mkdir -p ${OUT_CSS_DIR}`);
            
            await Utils.writeFile(this.getDynamicSCSS(), OUT_SCSS_DYNAMIC);
            await Utils.writeFile([ OUT_SCSS_DYNAMIC, STYLES_MAIN ].map(file => `@import '${file}';`).join("\n"), OUT_SCSS_IMPORTS);

            await Utils.execAsync(`sassc ${OUT_SCSS_IMPORTS} ${OUT_CSS_IMPORTS}`);

            App.applyCss(OUT_CSS_IMPORTS, true);
        }
        catch(err) {
            console.log(err);
        }

        // min of 250ms extra for reloading css again
        setTimeout(() => { this._reloading = false; }, 250);
    }
};