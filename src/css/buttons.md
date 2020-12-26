---
permalink: /guides/buttons/
title: ui-js Buttons
---

To represent a group of related buttons, use the `<ui-buttons>` element.

| Attribute  | Description                                              |
| :--------- | :------------------------------------------------------- |
| `pill`     | Set the shape of all the buttons in the button group     |
| `radio`    | Only one button in the group can be active at a time     |
| `checkbox` | One or more buttons in the group can be active at a time |
| `vertical` | The buttons are displayed in a column                    |

## Button group

Buttons inside a `<ui-buttons>` element will be displayed next to each other
without padding.

```html playground
<ui-buttons>
    <ui-button>Back</ui-button>
    <ui-button>Forward</ui-button>
</ui-buttons>
```

## Radio and Checkbox group

A button group can have a state representing which buttons are "active"
(selected). The behavior of the buttons is controlled by the `radio` or
`checkbox` attribute.

```html playground
<ui-buttons checkbox>
    <ui-button>Bold</ui-button>
    <ui-button>Italic</ui-button>
    <ui-button>Underline</ui-button>
</ui-buttons>

<ui-buttons radio>
    <ui-button>Left</ui-button>
    <ui-button>Center</ui-button>
    <ui-button>Right</ui-button>
</ui-buttons>
```

## Split button

When a button has a default action and also offers variants of that action,
use a split button and popup-menu in a `<ui-buttons>` element.

```html playground
<ui-buttons>
    <ui-button>Save</ui-button>
    <ui-button>
        <ui-icon>chevron down</ui-icon>
        <ui-popup-menu>
            <ui-menu-item>Save as PDF</ui-menu-item>
            <ui-menu-item>Save as JPEG</ui-menu-item>
            <ui-menu-item>Save as PNG</ui-menu-item>
        </ui-popup-menu>
    </ui-button>
</ui-buttons>
```

## Dividers

To introduce a separation between two buttons in a group, use a `<ui-divider>`
element.

```html playground
<ui-buttons>
    <ui-button>Insert</ui-button>
    <ui-button>Duplicate</ui-button>
    <ui-button>Remove</ui-button>
    <ui-divider></ui-divider>
    <ui-button>Bring to Front</ui-button>
    <ui-button>Send to Back</ui-button>
</ui-buttons>
```
