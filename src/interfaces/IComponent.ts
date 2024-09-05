export interface IComponent {
    name: string;
    props: {};

    create(monitor: string, props: { [key: string]: any });
};