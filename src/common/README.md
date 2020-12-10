---
permalink: /essentials
title: Essentials
---

## Javascript

ui-js components are represented by an object in Javascript, descended
from `HTMLElement`.

To create a ui-js component, use the `new` operator.

```javascript
const menu = new UIContextMenuElement();
```

Then attach the object to a DOM element:

```javascript
document.body.addChild(menu);
```

ui-js objects may have custom methods to act on the object,
in addition to the standard methods of a `HTMLElement`.

```javascript
// Standard method (from HTMLElement)
menu.addEventListener('select'), (ev) => console.log('selected ', ev));
// Custom method (from UIContextMenuElement)
menu.show();
```

ui-js objects also have properties, some from `HTMLELement`, others
specific to the ui-js objet class.

## Markup

The properties of a ui-js object are usually **reflected** as attributes
of the corresponding tag.

Changing the value of a property changes the value of the corresponding
attribute and vice-versa. There are a few exceptions, however. Some
attributes are used only to set the initial value of a property and
are not updated subsequently. That's the case in particular for attributes
that reflect the "state" of an element, rather than its configuration.
For example, the `value` property is typically not reflected.
This convention is consistent with the behavior of native web elements.

Only properties of type `boolean`, `string` or `number` are reflected
as an attribute. More complex properties (for example arrays and object literals)
are only available as properties.

The presence of a boolean attribute indicate the value of its property
is `true`. Its absence indicates that the value of the property is `false`. The value of boolean attributes is ignored, only their
presence or absence is relevant.

```html
<ui-shape></ui-shape>
<!-- "disabled" is false -->

<ui-shape disabled></ui-shape>
<!-- "disabled" is true -->
<ui-shape disabled="true"></ui-shape>
<!-- "disabled" is true -->
<ui-shape disabled="foo"></ui-shape>
<!-- "disabled" is true -->
<ui-shape disabled="false"></ui-shape>
<!-- !! "disabled" is true -->
>
```

The name of an attribute is the kebab-case version of the property name.
So for example the property` backgroundColor` would be reflected as the attribute `background-color`.

When a property is a string enumeration (i.e. its value is one of a
finite set of strings), as a shorthand the value of the property can
be used as an attribute.

```
<ui-shape type=circle></ui-shape>
<ui-shape circle></ui-shape>
```