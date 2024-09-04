export interface IReloadable {
    load(): void;
    cleanup(): void;
};