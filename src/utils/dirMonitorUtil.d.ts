export default class DirectoryMonitor {
    constructor(baseDirectoryPath: string, recursive: boolean = false, watchFiles: boolean = false, onFolderChange: () => void = () => {}, onFileChange: () => void = () => {});
    
    watch(): void;
    cleanup(): void;
};