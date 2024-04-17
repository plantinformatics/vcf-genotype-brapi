#!/usr/bin/bash

# terminal_reset_style
#
# ../package.json : scripts : prepare : rollup changes colours of terminal text; use this command after prepare to send the ANSI sequence to reset the styling.

#  Equivalent : echo -e '\e[0m'
echo -e '\033[0m'

