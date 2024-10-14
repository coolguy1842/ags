import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import System from "system";

const entry = `${App.configDir}/src/main.ts`;
const outDir = `/tmp/coolguy/ags/js`;

const hotReloadFile = `${App.configDir}/hotreload`;

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

function initTemp() {
    Utils.exec(`mkdir -p ${outDir}`);

    // cleanup old js files (probably unsafe lol make sure outdir is set well)
    const files = (Utils.exec(`ls ${outDir}`)).split("\n");
    for(const file of files) {
        Utils.exec(`rm ${outDir}/${file}`);
    }
}

// this is very dirty
let PathMonitorImport = null;
let pathMonitors = [];
async function initHotReloader() {
    try {
        const pathMonitorPath = `${App.configDir}/src/utils/classes/PathMonitor.ts`;
        const pathMonitorCompiledPath = `${outDir}/PathMonitor.js`;

        Utils.exec([
            'bun', 'build', pathMonitorPath,
            '--outfile', `${pathMonitorCompiledPath}`,
            '--external', 'resource://*',
            '--external', 'gi://*',
        ]);

        PathMonitorImport = await import(`file://${pathMonitorCompiledPath}`);
        
        const pathMonitorClass = PathMonitorImport["PathMonitor"];
        const MonitorTypeFlags = PathMonitorImport["MonitorTypeFlags"];

        const onChange = (file, fileType, event) => {
            if(event == Gio.FileMonitorEvent.CHANGED) return;
        
            if(getShouldHotReload()) {
                console.log("")
                console.log(`reloading`);
    
                reloadAGS();
            }
        } 

        pathMonitors = [
            new pathMonitorClass(`${App.configDir}/src`, MonitorTypeFlags["FILE"] | MonitorTypeFlags["RECURSIVE"], onChange),
            new pathMonitorClass(`${App.configDir}/icons`, MonitorTypeFlags["FILE"] | MonitorTypeFlags["RECURSIVE"], onChange)
        ];
    
        for(const pathMonitor of pathMonitors) {
            pathMonitor.load();
        }
    }
    catch(err) {
        console.log(err);
    }
}

let imported = null;
let importedMain = null;
async function reloadAGS() {
    try {
        const outFile = `main.${GLib.get_monotonic_time()}.js`;
        await Utils.execAsync([
            'bun', 'build', entry,
            '--outfile', `${outDir}/${outFile}`,
            '--external', 'resource://*',
            '--external', 'gi://*',
        ]);

        if(imported != null) {
            importedMain.cleanup();
            
            importedMain = null;
            imported = null;

            // call garbage collector just incase
            System.gc();
        }
    
        imported = await import(`file://${outDir}/${outFile}`);
        importedMain = new imported.Main();
        importedMain.load();
    }
    catch (error) {
        console.error(error);
    }
}

initTemp();

reloadAGS();
initHotReloader();

export { };