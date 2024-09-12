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


const lerp = (a: number, b: number, alpha: number) => {
    return (1 - alpha) * a + alpha * b;
};


const LinearAnimation: PopupAnimation = {
    name: "linear",
    description: "Interpolates between the start and end linearly.",

    func(start, end, alpha) {
        return {
            x: lerp(start.x, end.x, alpha),
            y: lerp(start.y, end.y, alpha)
        };
    }
};



// code from https://gist.github.com/pushkine/fbc7cf18e0a40ffb02b3b3a20b74f4f1
/** MIT License github.com/pushkine/ */
export function generateCubicBezier(x1: number, y1: number, x2: number, y2: number) {
	if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
        throw new Error(`CubicBezier x1 & x2 values must be { 0 < x < 1 }, got { x1 : ${x1}, x2: ${x2} }`);
    }
    
	const ax = 1.0 - (x2 = 3.0 * (x2 - x1) - (x1 *= 3.0)) - x1;
	const ay = 1.0 - (y2 = 3.0 * (y2 - y1) - (y1 *= 3.0)) - y1;

	let i = 0, r = 0.0, s = 0.0, d = 0.0, x = 0.0;
	return(t: number) => {
		for(r = t, i = 0; 32 > i; i++) {
            if(1e-5 > Math.abs((x = r * (r * (r * ax + x2) + x1) - t))) {
                return r * (r * (r * ay + y2) + y1);
            }
			else if(1e-5 > Math.abs((d = r * (r * ax * 3.0 + x2 * 2.0) + x1))) {
                break;
            }

            r -= x / d;
        }

		if ((s = 0.0) > (r = t)) {
            return 0;
        }
		else if ((d = 1.0) < r) {
            return 1;
        }
		while (d > s) {
            if (1e-5 > Math.abs((x = r * (r * (r * ax + x2) + x1)) - t)) {
                break;
            }
			
            t > x ? (s = r) : (d = r), (r = 0.5 * (d - s) + s);
        }

		return r * (r * (r * ay + y2) + y1);
	};
};

const easeCurve = generateCubicBezier(0.25, 0.1, 0.25, 1);
const EaseAnimation: PopupAnimation = {
    name: "ease",
    description: "Interpolates between the start and end along a bezier curve.",

    func(start, end, alpha) {
        const getCurveValue = (start: number, end: number) => {
            return easeCurve(alpha) * (end - start) + start;
        };

        return {
            x: getCurveValue(start.x, end.x),
            y: getCurveValue(start.y, end.y)
        };
    }
};

export const PopupAnimations = {
    Linear: LinearAnimation,
    Ease: EaseAnimation
};