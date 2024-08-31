import Gio from "gi://Gio?version=2.0";

function emptyFunction(name) {

}

function arraysEqual(a1, a2) {
    return JSON.stringify(a1) == JSON.stringify(a2);
}

export default class DirectoryMonitor {
    _baseDirectoryPath = "";
    _recursive = false;

    _watchFiles = false;

    _prevFiles = [];
    _prevDirs = [];

    _fileWatchers = [];
    _folderWatchers = [];

    _onFileChange = (file = "") => {};
    _onFolderChange = (file = "") => {};


    _scanFiles() {
        return Utils.exec(`find ${this._baseDirectoryPath}${!this._recursive ? " -maxdepth 1" : ""} -type f`).split("\n");
    }
    
    _scanFolders() {
        if(!this._recursive) return [ this._baseDirectoryPath ];
        return Utils.exec(`find ${this._baseDirectoryPath} -type d`).split("\n");
    }


    _unloadFileWatchers() {
        for(const watcher of this._fileWatchers) {
            watcher.cancel();
        }

        this._fileWatchers = [];
    }

    _unloadFolderWatchers() {
        for(const watcher of this._folderWatchers) {
            watcher.cancel();
        }

        this._folderWatchers = [];
    }


    _loadFileWatchers() {
        this._unloadFileWatchers();

        const files = this._scanFiles();
        for(const file of files) {
            this._fileWatchers.push(Utils.monitorFile(file, () => {
                this._onFileChange(file);
            }, { flags: Gio.FileMonitorFlags.NONE, recursive: false }));
        }

        this._prevFiles = files;
    }

    _loadFolderWatchers() {
        this._unloadFolderWatchers();

        const folders = this._scanFolders();
        for(const folder of folders) {
            this._folderWatchers.push(Utils.monitorFile(folder, () => {
                if(this._watchFiles && !arraysEqual(this._prevFiles, this._scanFiles())) {
                    this._loadFileWatchers();
                }

                if(!arraysEqual(this._prevFolders, folders)) {
                    this._loadFolderWatchers();
                }
                

                this._onFolderChange(folder);
            }, { flags: Gio.FileMonitorFlags.WATCH_MOVES, recursive: false }));
        }

        this._prevFolders = folders;
    }

    /**
     * @param {string} baseDirectoryPath
     * @param {(string) => void} onFileChange
     * @param {(string) => void} onFolderChange
     * @param {boolean} recursive
     * @param {boolean} watchFiles
     */
    constructor(baseDirectoryPath, recursive = true, watchFiles = true, onFolderChange = emptyFunction, onFileChange = emptyFunction) {
        this._baseDirectoryPath = baseDirectoryPath;

        this._recursive = recursive;
        this._watchFiles = watchFiles;
        
        this._onFileChange = onFileChange;
        this._onFolderChange = onFolderChange;
    }


    watch() {
        if(this._watchFiles) {
            this._loadFileWatchers();
        }

        this._loadFolderWatchers();
    }

    cleanup() {
        this._unloadFileWatchers();
        this._unloadFolderWatchers();
    };
};