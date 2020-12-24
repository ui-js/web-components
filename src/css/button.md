---
permalink: /guides/button/
title: Button
---

A button is used to trigger immediate actions.

**Use title-case capitalization for button labels**.

**Use verbs in button labels**.

**Add an ellipsis to the button label when completing the task requires
additional information**

## Simple Button

```html playground
<button class="ui-button">Push Me</button>
```

## Size

Do not mix the size of buttons within a group.

```html playground
<div>
    <button class="ui-button xs">Extra-Small</button>
    <button class="ui-button sm">Small</button>
    <button class="ui-button md">Medium</button>
    <button class="ui-button lg">Large</button>
    <button class="ui-button xl">Extra-Large</button>
</div>
```

## Variants

**Use the `primary` variant for the most important or most likely
action**. There should be one primary button per
page.

**Use the `secondary` variant to indicate the most important or
most likely action, but with a decreases emphasis**. Don't use
a secondary button if there's already a primary button on the page.

**Use the `critical` variant for destructive actions**. Keep these buttons
separated from other buttons.

**Use the `lightweight` variants to reduce the visual weight of the
buttons**.

```html playground
<div>
    <button class="ui-button">Default</button>
    <button class="ui-button primary">Primary</button>
    <button class="ui-button secondary">Secondary</button>
    <button class="ui-button critical">Critical</button>
</div>

<h3>Lightweight</h3>
<div>
    <button class="ui-button lightweight">Lightweight</button>
    <button class="ui-button lightweight primary">Primary</button>
    <button class="ui-button lightweight secondary">Secondary</button>
    <button class="ui-button lightweight critical">Critical</button>
</div>
```

## States

```html playground
<div>
    <button class="ui-button">Enabled</button>
    <button class="ui-button" disabled>Disabled</button>
</div>
```

```html playground
<div>
    <button class="ui-button">Regular</button>
    <button class="ui-button active">Active</button>
</div>
```
