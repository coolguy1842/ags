import DirectoryMonitor from "./src/utils/dirMonitorUtil.js";
import GLib from "gi://GLib?version=2.0";

const entry = `${App.configDir}/src/main.ts`;
const outDir = `/tmp/coolguy/ags/js`;

const hotReloadFile = `${App.configDir}/hotreload`;

let reloading = false;
// let prevFiles = getFilesToWatch();

function getShouldHotReload() {
    const text = Utils.readFile(hotReloadFile);
    if(text != "yes") {
        if(text != "no") {
            Utils.writeFile("no", hotReloadFile);
        }

        return false;
    }

    return true;
}

let imported = null;
async function reloadAGS() {
    reloading = true;

    try {
        // cleanup old js files (probably unsafe lol make sure outdir is set well)
        const files = (await Utils.execAsync(`ls ${outDir}`)).split("\n");
        for(const file of files) {
            Utils.exec(`rm ${outDir}/${file}`);
        }

        const outFile = `main.${GLib.get_monotonic_time()}.js`;
        await Utils.execAsync([
            'bun', 'build', entry,
            '--outfile', `${outDir}/${outFile}`,
            '--external', 'resource://*',
            '--external', 'gi://*',
        ]);

        if(imported != null) {
            imported.cleanup();
            imported = null;
        }
    
        imported = await import(`file://${outDir}/${outFile}`);
        imported.init();
    }
    catch (error) {
        console.error(error);
    }

    // min of 500ms before reloading code
    setTimeout(() => { reloading = false; }, 500);
}

const monitor = new DirectoryMonitor(`${App.configDir}/src`, true, true, (_folder) => {}, (_file) => {
    if(!reloading && getShouldHotReload()) {
        console.log("")
        console.log(`reloading`);
        reloadAGS();
    }
});

reloadAGS();
monitor.watch();

export { };