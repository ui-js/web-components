---
permalink: /guides/popup-menu/
title: Popup Menu
---

## Overview

A popup menu is displayed in response to a click or tap on another
element.

## Usage Guidelines

Follow the [guidelines for menus](./guides/menus).

## Attributes

| Attributes | Property   |
| :--------- | :--------- |
| `disabled` | `disabled` |

## <span>Setting up a Popup Menu with <code>&lt;ui-menu-item&gt;</code> elements</span>

```html playground
<button class="menu-button">
    Planets<ui-popup-menu>
        <ui-menu-item>Anacreon</ui-menu-item>
        <ui-menu-item>Aurora</ui-menu-item>
        <ui-menu-item>Terminus</ui-menu-item>
        <ui-menu-item>Trantor</ui-menu-item>
    </ui-popup-menu>
</button>
```

## See Also

-   [Context Menu](/guides/context-menu)
-   [Context Menu API](<./docs/menus/#("context-menu-element"%3Amodule).(UIContextMenuElement%3Aclass)>)
