import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

export type TPosition = {
    x: number,
    y: number
};

export interface PopupAnimation {
    name: string;
    description: string;

    func: (start: TPosition, end: TPosition, alpha: number) => TPosition
};

export const animations: PopupAnimation[] = [
    {
        name: "linear",
        description: "Interpolates between the start and end linearly.",
        func(start, end, alpha) {
            const lerp = (a: number, b: number, alpha: number) => {
                return (1 - alpha) * a + alpha * b;
            };

            return {
                x: lerp(start.x, end.x, alpha),
                y: lerp(start.y, end.y, alpha)
            };
        }
    }
];