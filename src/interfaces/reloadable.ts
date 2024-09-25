export interface IReloadable {
    loaded: boolean;

    load(): void;
    cleanup(): void;
};