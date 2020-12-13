---
permalink: /guides/context-menu/
title: Context Menu
read_time: false
sidebar:
    - nav: 'mathlive'
---

## Overview

A context menu displays a list of commands specific to the current selection or
element with the keyboard focus.

Unlike other UI elements which are usually visible on the page, a context menu
element is invisible by default. It is only when it is trigerred by the user
that it is displayed on top of an invisible overlay (a scrim) that captures
pointer events. Its operation is effectively temporarily modal.

To display the context menu press the right button of a mouse,
tap with two fingers (trackpad), control+click (on macOS), press shift+F10, or
do a long press (touch devices).

The context menu appears near the pointer location or near the center of its
target element. The location of the context menu or its submenus, may be
altered to ensure that the context menu is not displayed outside the viewport.

## Usage Guidelines

**Includes only the most commonly used commands that apply to the current selection.**
Commands that do not apply in the current context should generally be
omitted, unless it is important to make clear that the command is
not currently applicable.
Avoid including global commands that are
independent of the selection, such as **Quit**, **New Window**, **Go Back**, etc... Try to limit the number of options in a menu to a dozen or so.

**Order the commands so that the most frequently used
are at the top of the menu.** Place destructive commands (**Delete**,
**Move to Trash**, etc...) at the bottom of the menu.

Follow the [other guidelines for menus](./guides/menus).

## Attributes

| Attributes | Property   |
| :--------- | :--------- |
| `disabled` | `disabled` |

## <span>Setting up a Context Menu with <code>&lt;ui-menu-item&gt;</code> elements</span>

To add a context menu to a target element, add a `<ui-context-menu>`
element as a child of the target.

You can also add it in Javascript with
`target.appenChild(new UIContextMenuElement())`.

Define the commands of the menu with `<ui-menu-item>` elements inside a
`<ui-context-menu>` tag.

```html playground
<div tabindex="0" class="zebra-zone">
    <ui-context-menu>
        <ui-menu-item>Red</ui-menu-item>
        <ui-menu-item>Green</ui-menu-item>
        <ui-menu-item>Blue</ui-menu-item>
        <ui-menu-item separator></ui-menu-item>
        <ui-menu-item>White</ui-menu-item>
        <ui-menu-item>Gray</ui-menu-item>
        <ui-menu-item>Black</ui-menu-item>
    </ui-context-menu>
    Right-Click here
</div>
```

## Setting up a Context Menu with JSON

Specify the commands of a context menu as a JSON data
structure, inside in a `<script>` tag when using markup, or as an argument
to the `UIContextMenuElement` constructor when using Javascript.

```html playground
<div tabindex="0" class="zebra-zone">
    <ui-context-menu>
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
    </ui-context-menu>
    Right-Click here
</div>
```

## Responding to a Context Menu

When the user selects a menu item, a `select` event is dispatched, unless an
`onSelect()` hook is specified in the menu item. This hook can be specified when
setting the menu items programatically, that is as an argument to `new UIContextMenuElement()`.

To identify the menu item that was selected, the event `detail` property or
the argument to the `onSelect` hook include:

| Property | Description                              |
| -------- | ---------------------------------------- |
| `label`  | the menu item label                      |
| `id`     | the menu item `id` property or attribute |
| `data`   | the menu item `data` property            |

<!-- prettier-ignore -->
```html playground
<div tabindex="0" class="zebra-zone">
    Right-Click here
</div>
```

```javascript
const menu = new UIContextMenuElement([
    { label: 'Bold' },
    { label: 'Italic' },
    {
        label: 'Underline',
        id: 'apply-underline',
        onSelect: (item) => console.log('onSelect hook:', item.id),
    },
    { type: 'separator' },
    { label: 'Red', data: { color: '#ff0000' } },
    { label: 'Green', data: { color: '#00ff00' } },
    { label: 'Blue', data: { color: '#0000ff' } },
    { label: 'Yellow', data: { color: '#ffff00' } },
    { label: 'Purple', data: { color: '#800080' } },
]);

menu.addEventListener('select', (ev) => {
    console.log('select event:', ev.detail.data ?? ev.detail.label);
});

document.querySelector('.zebra-zone').appendChild(menu);
```

## Submenus

Keep in mind that to be most effective, a context menu should contain as
few commands as possible.

<!-- prettier-ignore -->
```html playground
<div tabindex="0" class="zebra-zone">
    <ui-context-menu>
        <script type="application/json">
            [
                { "label": "Zoom Level",
                  "submenu": [
                        { "label": "25%" },
                        { "label": "50%" },
                        { "label": "100%" },
                        { "label": "200%" },
                        { "label": "400%" },
                        { "label": "600%" }
                    ]
                },
                { "type": "separator"},
                { "label": "Bold" }, 
                { "label": "Italic" }, 
                { "label": "Underline" }
            ]
        </script>
    </ui-context-menu>
    Right-Click here
</div>
```

## Disabled and Checked Menu Items

<!-- prettier-ignore -->
```html playground
<div tabindex="0" class="zebra-zone">
    <ui-context-menu>
        <script type="application/json">
            [
                { "label": "Bold" }, 
                { "label": "Italic", 
                    "checked": true 
                }, 
                { "label": "Underline" },
                { "label": "Outline", 
                    "disabled": true
                },
                { "type": "separator" },
                { "label": "Small" },
                { "label": "Medium",
                    "checked": true 
                },
                { "label": "Large" }
            ]
        </script>
    </ui-context-menu>
    Right-Click here
</div>
```

## Dynamic Menu Items

Menu items can provide access to alternate commands when the option/alt, shift
or command keys are pressed.

In the example below, pressing the option/alt key or the shift key changes
the label of the menu item.

Use this feature to provide alternate commands that are related to the default
command, not completely different commands.{.notice--info}

```html playground
<div tabindex="0" class="zebra-zone">Right-Click here</div>
```

```javascript
document.querySelector('.zebra-zone').appendChild(
    new UIContextMenuElement([
        {
            label: (item, kbd) =>
                kbd.alt ? 'Delete Immediately' : 'Move to Trash',
        },
        {
            label: (item, kbd) =>
                kbd.shift ? 'Add to Sidebar' : 'Add to Dock',
        },
    ])
);

document.querySelector('ui-context-menu').addEventListener('select', (ev) => {
    console.log(ev.detail.data ?? ev.detail.label);
    console.log(ev.detail.keyboardModifiers);
});
```

## Customizing the Context Menu

Define a custom stylesheet to customize the layout of a menu and the
appearance of menu items.

```html playground
<style>
    ui-context-menu::part(menu-container) {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-evenly;
        max-width: 228px;
    }
    ui-context-menu::part(menu-item) {
        width: 53px;
        height: 53px;
        margin: 0;
        padding: 4px;
        box-sizing: border-box;
        border: 3px solid transparent;
    }
    ui-context-menu::part(active) {
        border: 3px solid white;
        border-radius: 8px;
        background: transparent;
    }
</style>
<div tabindex="0" class="zebra-zone">
    <ui-context-menu>
        <style>
            ui-menu-item {
                width: 100%;
                height: 100%;
                border-radius: 8px;
            }
        </style>
        <ui-menu-item style="background:#397ae3"></ui-menu-item>
        <ui-menu-item style="background:#edb50c"></ui-menu-item>
        <ui-menu-item style="background:#ed570c"></ui-menu-item>
        <ui-menu-item style="background:#bd0865"></ui-menu-item>
        <ui-menu-item style="background:#ed40d0"></ui-menu-item>
        <ui-menu-item style="background:#ed7f5a"></ui-menu-item>
        <ui-menu-item separator></ui-menu-item>
        <ui-menu-item style="background:#18cc48"></ui-menu-item>
        <ui-menu-item style="background:#6bed5a"></ui-menu-item>
        <ui-menu-item style="background:#327aad"></ui-menu-item>
        <ui-menu-item style="background:#86dbb8"></ui-menu-item>
    </ui-context-menu>
    Right-Click here
</div>
```

## See Also

-   [Context Menu](<./docs/menus/#("context-menu-element"%3Amodule).(UIContextMenuElement%3Aclass)>)
