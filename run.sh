#!/bin/bash

ags_command="env GDK_BACKEND=wayland ags"

start_normal_bar() {
    echo ""
    
    $ags_command &
    echo -e "\n"
    exit
}

killall ags
trap 'start_normal_bar' INT

$ags_command $1
