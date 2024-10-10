import Gdk from "gi://Gdk";
import GdkPixbuf from "gi://GdkPixbuf";
import Pango from "gi://Pango";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { globals } from "src/globals";
import { DerivedVariable } from "src/utils/classes/DerivedVariable";
import { PopupAnimations } from "src/utils/classes/PopupAnimation";
import { PopupWindow } from "src/utils/classes/PopupWindow";
import Mexp from "src/utils/math-expression-evaluator/index";
import { sleep, splitToNChunks } from "src/utils/utils";
import Gtk from "types/@girs/gtk-3.0/gtk-3.0";
import { Binding } from "types/service";
import Box from "types/widgets/box";
import Button from "types/widgets/button";
import Label from "types/widgets/label";

interface AppLauncherItem {
    title: string;
    icon?: GdkPixbuf.Pixbuf;

    child?: Gtk.Widget,

    onClick: () => void;
};



function updateCursor(itemCursor: Variable<number>, itemScroll: Variable<number>, items: Variable<AppLauncherItem[]>, newValue: number, rows: number, columns: number) {
    itemCursor.value = Math.max(0, Math.min(newValue, items.value.length - 1));

    updateScroll(itemCursor, itemScroll, items, rows, columns);
}

function updateScroll(itemCursor: Variable<number>, itemScroll: Variable<number>, items: Variable<AppLauncherItem[]>, rows: number, columns: number) {
    var scrollAmount = itemScroll.value * columns;
    var visibleItems = (columns * rows) + scrollAmount;

    var totalColumns = Math.ceil(items.value.length / columns);
    if(itemScroll.value > Math.max(totalColumns - rows, 0)) {
        itemScroll.value = totalColumns - rows;
    }
    else if(itemScroll.value < 0) {
        itemScroll.value = 0;
    }

    while(itemCursor.value < scrollAmount || itemCursor.value >= visibleItems) {
        if(itemCursor.value >= visibleItems) {
            itemScroll.value++;
        }
    
        if(itemCursor.value < scrollAmount) {
            itemScroll.value--;
        }

        scrollAmount = itemScroll.value * columns;
        visibleItems = (columns * rows) + scrollAmount;
    }
}


function createAppLauncherItemWidget(index: number, appLauncherItem: AppLauncherItem, itemCursor: Variable<number>, iconSize: number | Binding<any, any, number>) {
    const checkSelected = (self: Button<any, unknown>) => {
        self.toggleClassName("app-launcher-item-selected", itemCursor.value == index);
    }

    var child;
    if(appLauncherItem.child != undefined) {
        if(appLauncherItem.icon != undefined) {
            child = Widget.Box({
                children: [
                    Widget.Icon({
                        icon: appLauncherItem.icon,
                        size: iconSize
                    }),
                    child
                ]
            })
        }
        else {
            child = appLauncherItem.child;
        }
    }
    else {
        child = Widget.Icon({
            icon: appLauncherItem.icon,
            size: iconSize
        });
    }

    return Widget.Button({
        className: "app-launcher-item",
        child: child,
        onClicked: () => appLauncherItem.onClick(),
        setup: (self) => {
            checkSelected(self);

            self.on("enter-notify-event", () => {
                itemCursor.value = index;
            });
        }
    }).hook(itemCursor, checkSelected);
}

const applications = await Service.import("applications");
const MathExpression = new Mexp();

function updateItemContainer(
    container: Box<Gtk.Widget, unknown>, containerWidth: Variable<number>,
    searchInput: Variable<string>, launcherItems: Variable<AppLauncherItem[]>, itemCursor: Variable<number>, itemScroll: Variable<number>
) {
    const { app_launcher } = globals.optionsHandler!.options;


    var mathOutput: number | undefined;
    try {
        mathOutput = MathExpression.eval(searchInput.value);
    }
    catch(err) {
        mathOutput = undefined;
    }

    if(mathOutput != undefined) {
        launcherItems.value = [
            {
                title: "Copy to Clipboard",
                child: Widget.Label({
                    label: `${mathOutput}`,
                    hpack: "center",
                    ellipsize: Pango.EllipsizeMode.START,
                    widthRequest: containerWidth.value - (app_launcher.item.padding.value * 2)
                }),
                onClick: async () => {
                    console.log(Utils.execAsync(`wl-copy ${mathOutput}`));
                    globals.popupWindows?.AppLauncherPopupWindow.hide();
                }
            }
        ];
    }
    else if(/^[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(searchInput.value)) {
        launcherItems.value = [
            {
                title: "Open in Browser",
                child: Widget.Label({
                    label: `${searchInput.value}`,
                    hpack: "center",
                    ellipsize: Pango.EllipsizeMode.MIDDLE,
                    widthRequest: containerWidth.value - (app_launcher.item.padding.value * 2)
                }),
                onClick: async () => {
                    console.log(Utils.execAsync(`xdg-open "https://${searchInput.value}"`));
                    globals.popupWindows?.AppLauncherPopupWindow.hide();
                }
            }
        ];
    }
    else {
        launcherItems.value = applications.list.filter(application => application.match(searchInput.value)).map(application => {
            return {
                title: `Launch ${application.name}`,
                icon: Utils.lookUpIcon(application.icon_name ?? undefined, 32)?.load_icon(),
                
                onClick: () => {
                    application.launch();
                    globals.popupWindows?.AppLauncherPopupWindow.hide();
                }
            }
        });
    }

    const scrollAmount = itemScroll.value * app_launcher.columns.value;
    container.children = splitToNChunks(
        launcherItems.value.slice(scrollAmount, (app_launcher.rows.value * app_launcher.columns.value) + scrollAmount),
        app_launcher.columns.value
    ).map((items, index) => Widget.Box({
        spacing: app_launcher.item.spacing.value,
        children: items.map((item, index2) => {
            return createAppLauncherItemWidget((index * app_launcher.columns.value) + index2 + scrollAmount, item, itemCursor, app_launcher.item.icon_size.value);
        })
    }));
}

export function createAppLauncherPopupWindow() {
    const { app_launcher } = globals.optionsHandler!.options;
    const containerWidth = new DerivedVariable(
        [app_launcher.item.icon_size, app_launcher.spacing, app_launcher.columns, app_launcher.item.padding],
        (icon_size, spacing, cols, padding) => {
            return (cols * (icon_size + (padding * 2))) + (cols * (spacing));
        }
    );

    const searchInput = new Variable("");
    const launcherItems = new Variable([] as AppLauncherItem[]);

    const itemCursor = new Variable(0);
    const itemScroll = new Variable(0);
    

    const updateTitle = (self: Label<unknown>) => {
        self.label = launcherItems.value[itemCursor.value]?.title ?? "Empty";
    }

    const popupWindow = new PopupWindow(
        {
            name: "app-launcher-popup-window",
            keymode: "on-demand",
            exclusivity: "exclusive"
        },
        Widget.Box({
            className: "app-launcher",
            vertical: true,
            spacing: app_launcher.spacing.bind(),
            children: [
                Widget.Entry({
                    className: "app-launcher-input",
                    onChange: (self) => searchInput.value = self.text ?? "",
                    setup: (self) => {
                        self.hook(searchInput, () => self.text = searchInput.value);

                        self.keybind("Return", () => launcherItems.value[itemCursor.value]?.onClick());

                        const changeCursor = (newValue: number) => updateCursor(itemCursor, itemScroll, launcherItems, newValue, app_launcher.rows.value, app_launcher.columns.value);
                        self.keybind("Left", () => {
                            if(self.cursor_position != 0) return;
                            changeCursor(itemCursor.value - 1);
                        });

                        self.keybind("Right", () => {
                            if(self.cursor_position != self.text_length) return;
                            changeCursor(itemCursor.value + 1);
                        });
                        
                        self.keybind("Up", (self) => {
                            changeCursor(itemCursor.value - app_launcher.columns.value);
                        })

                        self.keybind("Down", async (self) => {
                            changeCursor(itemCursor.value + app_launcher.columns.value);

                            // have to have this, if not then down arrow removes focus from the input
                            self.grab_focus();
                        })
                    }
                }),
                Widget.Label({
                    className: "app-launcher-title",
                    ellipsize: Pango.EllipsizeMode.END,
                    setup: (self) => {
                        updateTitle(self);

                        self.hook(itemCursor, updateTitle);
                        self.hook(launcherItems, updateTitle);
                    }
                }),
                Widget.Box({
                    className: "app-launcher-item-container",
                    vertical: true,
                    hpack: "center",
                    hexpand: true,
                    widthRequest: containerWidth.bind(),
                    spacing: app_launcher.item.spacing.bind(),
                    setup: (self) => {
                        const updateContainer = () => updateItemContainer(self, containerWidth, searchInput, launcherItems, itemCursor, itemScroll);
                        updateContainer();

                        // cant use bind in children or they flicker when a change happens so hook into variables instead
                        self.hook(itemScroll, () => updateContainer());
                        self.hook(searchInput, () => updateContainer());
                        self.hook(containerWidth, () => updateContainer());
                        
                        self.hook(app_launcher.item.spacing, () => updateContainer());
                        self.hook(app_launcher.item.icon_size, () => updateContainer());
                        self.hook(app_launcher.columns, () => updateContainer());
                        self.hook(app_launcher.rows, () => updateContainer());

                        self.on("scroll-event", (self, event: Gdk.Event) => {
                            const deltas = event.get_scroll_deltas();
                            if(deltas == undefined || !deltas[0]) return;

                            const changeCursor = (newValue: number) => {
                                updateCursor(itemCursor, itemScroll, launcherItems, newValue, app_launcher.rows.value, app_launcher.columns.value);
                            }

                            if(deltas[2] < 0) {
                                const prevScroll = itemScroll.value;
                                changeCursor(itemCursor.value - app_launcher.columns.value);

                                if(itemScroll.value == prevScroll) {
                                    itemScroll.value--;

                                    updateScroll(itemCursor, itemScroll, launcherItems, app_launcher.rows.value, app_launcher.columns.value);
                                }
                            }
                            else if(deltas[2] > 0) {
                                const prevScroll = itemScroll.value;
                                changeCursor(itemCursor.value + app_launcher.columns.value);

                                if(itemScroll.value == prevScroll) {
                                    itemScroll.value++;

                                    updateScroll(itemCursor, itemScroll, launcherItems, app_launcher.rows.value, app_launcher.columns.value);
                                }
                            }
                        })
                    }
                })
            ]
        }),
        { animation: PopupAnimations.Ease, animateTransition: true, duration: 0.4, refreshRate: 165 }
    );

    popupWindow.once("cleanup", () => {
        containerWidth.stop();
    });

    popupWindow.on("hideComplete", () => {
        searchInput.value = "";
        itemCursor.value = 0;
        itemScroll.value = 0;
    });

    return popupWindow;
}

export function toggleAppLauncherPopupWindow(monitor: number) {
    const appLauncherPopup = globals.popupWindows?.AppLauncherPopupWindow;
    if(!appLauncherPopup) return;
    if(appLauncherPopup.window.is_visible() && appLauncherPopup.window.monitor == monitor) {
        appLauncherPopup.hide();

        return;
    }

    const endDerived = new DerivedVariable(
        [
            appLauncherPopup.screenBounds,
            appLauncherPopup.childAllocation
        ],
        (screenBounds, childAllocation) => {
            return {
                x: (screenBounds.width / 2) - (childAllocation.width / 2),
                y: screenBounds.height - 15
            }
        }
    );

    const startDerived = new DerivedVariable(
        [
            endDerived,
            appLauncherPopup.screenBounds,
            appLauncherPopup.childAllocation
        ],
        (end, screenBounds, childAllocation) => {
            return {
                x: end.x,
                y: screenBounds.height + childAllocation.height
            }
        }
    );

    const onStop = () => {
        startDerived.stop();
        endDerived.stop();
    };

    appLauncherPopup.onceMulti({
        "hideComplete": onStop,
        "cleanup": onStop
    });

    appLauncherPopup.show(monitor, startDerived, endDerived);
}