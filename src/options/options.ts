import { option } from "../utils/handlers/optionsHandler";
import { BarLayoutValidator, TBarLayout } from "./validators/barLayoutValidator";

import { HEXColorValidator } from "./validators/hexColorValidator";
import { IconNameValidator } from "./validators/iconNameValidator";
import { NumberValidator } from "./validators/numberValidator";
import { ValueInEnumValidator } from "./validators/valueInEnumValidator";

export enum BarPosition {
    TOP = "top",
    BOTTOM = "bottom"
};


export function generateOptions() {
    return {
        icons: {
            app_launcher: {
                search: option("system-search-symbolic", IconNameValidator.create())
            }
        },
    
        bar: {
            position: option(BarPosition.BOTTOM, ValueInEnumValidator.create(BarPosition)),
            height: option(32, NumberValidator.create({ min: 1 })),
    
            outer_padding: option(8, NumberValidator.create({ min: 0 })),
            widget_spacing: option(6, NumberValidator.create({ min: 0 })),
    
            background: option("#000000BF", HEXColorValidator.create()),
            icon_color: option("#5D93B0FF", HEXColorValidator.create()),

            layout: {
                left: option([
                    { name: "WorkspaceSelector" }
                ] as TBarLayout, BarLayoutValidator.create()),
                center: option([
                    { name: "WorkspaceSelector" }
                ] as TBarLayout, BarLayoutValidator.create()),
                right: option([
                    { name: "WorkspaceSelector" }
                ] as TBarLayout, BarLayoutValidator.create())
            }
        }
    };
}