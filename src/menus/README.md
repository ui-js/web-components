---
permalink: /guides/menus/
title: Menus
read_time: false
---

## Usage Guidelines

Contextual menu are used to display a list of commands specific to the current
selection or keyboard focus.

A contextual menu is invoked using a platform-specific convention, such as
pressing the right button of a mouse, tapping with two fingers (trackpad),
control+click (for example on macOS), shift+F10, or long press (touch devices).

The contextual menu appears near the pointer location or near the center of the
object it is attached to.

The options in a contextual menu should be relevant to the current selection.

Avoid including global commands that are independent of the selection (Quit,
New Window, Back, etc...).

To be effective, a contextual menu should only contain the most most common
and most relevant commands. Within the contextual menu, order the commands
so that the most frequently used are at the top of the menu.

Commands that do not apply in the current context should generally be
omitted, unless it is important to make clear that the command is
not currently applicable.

Use title case for the label of commands, e.g. "Switch to Fullscreen Mode".
If the command require additional input to be completed, end the label with an
ellipsis character (…). Do not use three dots (...) or any other punctuation.

Use a separator in between groups of related commands.

Icons can be used to make commands easier to recognize. Do not use purely
decorative icons. If an icon in a group has an icon, all the commands in the
same group should have an icon.

Place the contextual menu component in a parent container. A right-click,
control+click, or long press in this container will trigger the menu. Similarly
if the container has the keyboard focus, pressing shift+F10 will display
the contextual menu in the center of the container.

## Simple Example

<!-- prettier-ignore -->
<code-playground layout="stack" class="m-lg w-full-lg">
<div slot="html">
<div
    tabindex="0"
    style="display: flex; align-items: center; justify-content: center; height: 6em; font-size: 1.5em; font-weight: 700; color: #999"
>
    <ui-contextual-menu>
        <script type="application/json">
            [
                { "label": "Bold" }, 
                { "label": "Italic" }, 
                { "label": "Underline" }, 
                { "type": "separator" }, 
                { "label": "Red" },
                { "label": "Green" },
                { "label": "Blue" },
                { "label": "Yellow" },
                { "label": "Purple" }
            ]
        </script>
    </ui-contextual-menu>
    Right-Click or Control+Click here
</div>
</div>
</code-playground>

When the user selects a menu item, the associated `onSelect` hook is invoked.

If no `onSelect` hook is provided, a `select` event is dispatched.

## Submenus

<!-- prettier-ignore -->
<code-playground layout="stack" class="m-lg w-full-lg">
<div slot="html">
<div
    tabindex="0"
    style="display: flex; align-items: center; justify-content: center; height: 6em; font-size: 1.5em; font-weight: 700; color: #999"
>
    <ui-contextual-menu>
        <script type="application/json">
            [
                { "label": "Zoom Level",
                  "submenu": [
                        { "label": "0%" },
                        { "label": "25%" },
                        { "label": "50%" },
                        { "label": "100%" },
                        { "label": "200%" },
                        { "label": "400%" }
                    ]
                },
                { "label": "Bold" }, 
                { "label": "Italic" }, 
                { "label": "Underline" }
            ]
        </script>
    </ui-contextual-menu>
    Right-Click or Control+Click here
</div>
</div>
</code-playground>

## See Also

-   [Contextual Menu](<./docs/menus/#("contextual-menu-element"%3Amodule).(UIContextualMenuElement%3Aclass)>)
