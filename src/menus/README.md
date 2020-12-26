---
permalink: /guides/menus/
title: Menus
read_time: false
---

## Overview

## Usage Guidelines

**Use title case for the label of commands.** For example. **Switch to Fullscreen Mode**.
When the command requires additional input to be completed, end the label with an
ellipsis character (…). Do not use three dots (...) or any other punctuation.

**Use a divider in between groups of related commands.** Grouping related
commands can make scanning the menu quicker.

**You may use icons to make commands easier to recognize.** Do not use purely
decorative icons. If an item in a group has an icon, all the items in the
same group should have an icon.

**Use submenus to groups commands that are a variant of the same action.** For example "Color > Red, Green, Blue" or "Move to > Inbox, Archive,
Draft". Do not use submenus to group unrelated commands. Keep submenus to one level, or avoid them altogether if possible.

### Keyboard Interaction

| Key                                                          | Action                                                                        |
| :----------------------------------------------------------- | :---------------------------------------------------------------------------- |
| ⬆︎ ⬇︎ <br> **Page Up**, **Page Down** <br> **Home**, **End** | change the active menu item                                                   |
| **Space**, **Return**                                        | select a menu item or open a submenu                                          |
| ⬅︎ ➡︎                                                        | navigate submenus                                                             |
| **ESC**                                                      | dismiss a context menu                                                        |
| **Tab**, **Shift-Tab**                                       | jump to the next/previous keyboard focusable                                  |
| alphanumeric keys                                            | type select (typing a few characters will make the matching menu item active) |

The keyboard focus is restored when the menu is dismissed.

### Accessibility

Menu elements are screen reader compatible: the various components of a menu are labeled with the appropriate ARIA attributes.

### Theming

Menus support dark and light mode.

### Styling

A menu can be styled and customized using `::part()` selectors and embedded stylesheets.

The supported parts are:

| Part             | Description                                                                                                 |
| :--------------- | :---------------------------------------------------------------------------------------------------------- |
| `menu-container` | The element containing the menu items. Customize this part to control the layout and appearance of the menu |
| `menu-item`      | An individual menu item. Customize this part to control the layout and appareance of individual menu items  |
| `menu-divider`   | A menu-item with a `divider` attribute                                                                      |
| `active`         | The currently active (highlighted) menu item                                                                |
| `checked`        | A menu item that is in a checked state                                                                      |
| `disabled`       | A menu item in a disabled state                                                                             |

## See Also

<div class="card">
<a class="section-link" href="/guides/context-menu/" target="_self" rel="follow" aria-hidden="true"
    tabindex="-1">
<div class="icon-secondary">
    <i class="fa-4x fal fa-file-alt"></i>
</div>
<div class='copy'>
    <h3>Context Menu</h3>
    <p>A menu invoked with a right-click or a long press.</p>
    <a href="/guides/context-menu">Learn more<i class=" fas fa-chevron-right navigation"></i></a>
</div>
&nbsp;</a></div>
