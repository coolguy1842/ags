import Gdk from "gi://Gdk?version=3.0";

export interface RGBA {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

export function HEXtoRGBA(hex: string): RGBA {
    if(/^#[A-Fa-f0-9]{8}$/.test(hex)) {
        var hexStr = hex.substring(1);
        const num = Number.parseInt(`0x${hexStr}`);

        return {
            red: num >> 24 & 255,
            green: num >> 16 & 255,
            blue: num >> 8 & 255,
            alpha: num & 255
        };
    }

    return {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 255,
    };
}

export function HEXtoSCSSRGBA(hex: string): string {
    if(/^#[A-Fa-f0-9]{8}$/.test(hex)) {
        var hexStr = hex.substring(1);
        const num = Number.parseInt(`0x${hexStr}`);

        return `rgba($color: ${hex.slice(0, -2)}, $alpha: ${(num & 255) / 255})`;
    }

    return `rgba($color: #000000, $alpha: 0.0)`;
}

export function HEXtoCSSRGBA(hex: string): string {
    const rgba = HEXtoRGBA(hex);
    
    return `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${rgba.alpha / 255})`;
}

export function HEXtoGdkRGBA(hex: string): Gdk.RGBA {
    const rgb = new Gdk.RGBA();
    rgb.alpha = 1.0;

    if(/^#[A-Fa-f0-9]{8}$/.test(hex)) {
        var hexStr = hex.substring(1);
        const num = Number.parseInt(`0x${hexStr}`);

        rgb.red = (num >> 24 & 255) / 255;
        rgb.green = (num >> 16 & 255) / 255;
        rgb.blue = (num >> 8 & 255) / 255;
        rgb.alpha = (num & 255) / 255;
    }
    
    return rgb;
}