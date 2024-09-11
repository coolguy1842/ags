import Gtk from "gi://Gtk?version=3.0";
import { Button } from "resource:///com/github/Aylur/ags/widgets/button.js";

const audio = await Service.import("audio");
const battery = await Service.import("battery");
const bluetooth = await Service.import("bluetooth");
const network = await Service.import("network");
const mpris = await Service.import("mpris");

export function getQuickMenuButton() {
    const defaultProps = {};
    
    function updateLabel(button: Button<Gtk.Widget, unknown>) {
        var out = "";

        // mpris
        {
            
        }

        // network
        {
            const wifi = network.wifi;
            if(wifi.enabled) {
                switch(wifi.internet) {
                case "connected":
                    const strength = wifi.strength;
                    if(strength >= 80) {
                        out += "󰤨  ";
                    }
                    else if(strength >= 60) {
                        out += "󰤥  ";
                    }
                    else if(strength >= 40) {
                        out += "󰤢  ";
                    }
                    else if(strength >= 20) {
                        out += "󰤯  ";
                    }

                    break;
                case "connecting":
                    out += "󰤫  ";
                    break;
                case "disconnected":
                    out += "󰤮  ";
                    break;
                default: break;
                }
            }
        }

        // bluetooth
        {
            /* valid states are:
            --------------------
            absent
            on
            turning-on
            turning-off
            off
            --------------------
            */
            switch(bluetooth.state) {
            case "on":
                out += " ";
                break;
            default: break;
            }
        }

        // battery
        if(battery.available) {
            // untested as i havent tried on a laptop
            if(battery.percent >= 95) {
                out += !battery.charging ? "󰁹 " : "󰂅  ";
            }
            else if(battery.percent >= 85) {
                out += !battery.charging ? "󰂂 " : "󰂋  ";
            }
            else if(battery.percent >= 75) {
                out += !battery.charging ? "󰂁 " : "󰂊  ";
            }
            else if(battery.percent >= 65) {
                out += !battery.charging ? "󰂀 " : "󰢞  ";
            }
            else if(battery.percent >= 55) {
                out += !battery.charging ? "󰁿 " : "󰂉  ";
            }
            else if(battery.percent >= 45) {
                out += !battery.charging ? "󰁾 " : "󰢝  ";
            }
            else if(battery.percent >= 35) {
                out += !battery.charging ? "󰁽 " : "󰂈  ";
            }
            else if(battery.percent >= 25) {
                out += !battery.charging ? "󰁼 " : "󰂇  ";
            }
            else if(battery.percent >= 15) {
                out += !battery.charging ? "󰁻 " : "󰂆  ";
            }
            else if(battery.percent >= 5) {
                out += !battery.charging ? "󰁺 " : "󰢜  ";
            }
            else {
                out += !battery.charging ? "󱃍  " : "󰢟  ";
            }
        }

        // volume
        {
            const speaker = audio.speaker;
            const volume = speaker.volume * 100;

            if(speaker.is_muted) {
                out += "󰸈 ";
            }
            else if(volume >= 70) {
                out += "󰕾  ";
            }
            else if(volume >= 30) {
                out += "󰖀 ";
            }
            else if(volume > 0) {
                out += "󰕿 ";
            }
            else {
                out += "󰸈 ";
            }
        }

        out += "";
        button.label = out;
    }

    return {
        name: "QuickMenuButton",
        props: defaultProps,
        create(monitor: string, props: typeof defaultProps) {
            return Widget.Button({
                class_name: "bar-quick-menu-button",
                // TODO: make the icons appear dynamically (probably with Utils.derive)
                // label: "󰖩 󰂯  󱊣 ",
                onClicked: () => {
                    // TODO: open quick menu here
                },
                setup: (btn) => {
                    updateLabel(btn);
                }
            })
                .hook(audio.speaker, (btn) => updateLabel(btn))
                .hook(battery, (btn) => updateLabel(btn))
                .hook(bluetooth, (btn) => updateLabel(btn))
                .hook(network, (btn) => updateLabel(btn));
        }
    };
}