import { option } from "../utils/handlers/optionsHandler";
import { BarLayoutValidator, TBarLayout } from "./validators/barLayoutValidator";

import { HEXColorValidator } from "./validators/hexColorValidator";
import { IconNameValidator } from "./validators/iconNameValidator";
import { NumberValidator } from "./validators/numberValidator";
import { StringArrayValidator } from "./validators/stringArrayValidator";
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
                    { name: "AppLauncherButton" },
                    { name: "WorkspaceSelector" }
                ] as TBarLayout, BarLayoutValidator.create()),
                center: option([
                    { name: "Clock" }
                ] as TBarLayout, BarLayoutValidator.create()),
                right: option([
                    { name: "SystemTray" }
                ] as TBarLayout, BarLayoutValidator.create())
            }
        },

        system_tray: {
            background: option("#000000BF", HEXColorValidator.create()),
            favorites: option([] as string[], StringArrayValidator.create()),

            icon_size: option(14, NumberValidator.create({ min: 4 })),
            spacing: option(3, NumberValidator.create({ min: 0 })),

            padding: option(8, NumberValidator.create({ min: 0 })),
            border_radius: option(12, NumberValidator.create({ min: 0, max: 50 }))
        },

        app_launcher: {
            background: option("#000000BF", HEXColorValidator.create()),

            padding: option(8, NumberValidator.create({ min: 0 })),
            border_radius: option(12, NumberValidator.create({ min: 0, max: 50 })),

            input: {
                background: option("#202020FF", HEXColorValidator.create()),

                border_radius: option(12, NumberValidator.create({ min: 0, max: 50 }))
            },

            item: {
                background: option("#00000000", HEXColorValidator.create()),
                background_selected: option("#383838FF", HEXColorValidator.create()),

                padding: option(4, NumberValidator.create({ min: 0 })),
                border_radius: option(8, NumberValidator.create({ min: 0, max: 50 })),

                icon_size: option(32, NumberValidator.create({ min: 1 })),
                spacing: option(4, NumberValidator.create({ min: 0 })),
            },

            spacing: option(4, NumberValidator.create({ min: 0 })),

            rows: option(4, NumberValidator.create({ min: 1 })),
            columns: option(5, NumberValidator.create({ min: 1 }))
        }
    };
}