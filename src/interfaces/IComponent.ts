export interface IComponent {
    name: string;

    create(monitor: string);
};