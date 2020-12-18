---
permalink: /guides/button/
title: ui-js Button
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

## Sizes

Do not mix the size of buttons within a group.

```html playground
<div class="ui-buttons">
    <button class="ui-button xs">Extra-Small</button>
    <button class="ui-button sm">Small</button>
    <button class="ui-button md">Medium</button>
    <button class="ui-button lg">Large</button>
    <button class="ui-button xl">Extra-Large</button>
</div>
```

Use the `xs`, `sm`, `md`, `lg` or `xl` class with the `ui-buttons`
class to indicate the size of the buttons in the button group.

```html playground
<div class="ui-buttons xs">
    <button class="ui-button">Bold</button>
    <button class="ui-button">Italic</button>
    <button class="ui-button">Underline</button>
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

**Use the `minimal` variants to reduce the visual weight of the
buttons**.

```html playground
<div class="ui-buttons">
    <button class="ui-button">Default</button>
    <button class="ui-button primary">Primary</button>
    <button class="ui-button secondary">Secondary</button>
    <button class="ui-button critical">Critical</button>
</div>

<h3>Minimal</h3>
<div class="ui-buttons">
    <button class="ui-button minimal">Minimal</button>
    <button class="ui-button minimal primary">Primary</button>
    <button class="ui-button minimal secondary">Secondary</button>
    <button class="ui-button minimal critical">Critical</button>
</div>
```

## States

```html playground
<div class="ui-buttons">
    <button class="ui-button">Enabled</button>
    <button class="ui-button" disabled>Disabled</button>
</div>
```
