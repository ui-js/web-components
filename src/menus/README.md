Contextual menu are used to display a list of commands specific to the current
selection or keyboard focus.

A contextual menu is invoked using a platform-specific convention, such as
pressing the right button of a mouse, tapping with two fingers (trackpad),
control+click (for example on macOS), shift+F10, or long press (touch devices).

The contextual menu appears near the pointer location or near the center of the
object it is attached to.

The options in a contextual menu should be relevant to the current selection.

Avoid including global command that are independent of the selection (Quit,
New Window, Back, etc...).

To be effective, a contextual menu should only contain the most most common
and most relevant commands. Put the most common commands at the top of
the menu.

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
