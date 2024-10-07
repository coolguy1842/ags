import { option, Option, TOptions } from "../utils/handlers/optionsHandler";
import { HEXColorValidator } from "./validators/hexColorValidator";
import { IconNameValidator } from "./validators/iconNameValidator";
import { NumberValidator } from "./validators/numberValidator";
import { ValueInEnumValidator } from "./validators/valueInEnumValidator";

export enum BarPosition {
    TOP = "top",
    BOTTOM = "bottom"
};

export const options = {
    icons: {
        app_launcher: {
            search: option("system-search-symbolic", new IconNameValidator())
        }
    },

    bar: {
        position: option(BarPosition.BOTTOM, new ValueInEnumValidator(BarPosition)),
        height: option(32, new NumberValidator({ min: 12, max: 60 })),

        background: option("#000000BF", new HEXColorValidator()),
        icon_color: option("#5D93B0FF", new HEXColorValidator())
    }
};