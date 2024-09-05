export interface IComponent {
    name: string;

    create(monitor: string, props: { [key: string]: any });
};