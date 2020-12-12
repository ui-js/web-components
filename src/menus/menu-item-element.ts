import { UIElement } from '../common/ui-element';
import { MenuItem } from './menu-base';

const MENU_ITEM_STYLE = document.createElement('template');
MENU_ITEM_STYLE.innerHTML = `<style>
:host {
    display: inline;
    color-scheme: light dark;
    --active-label-color: #fff;
    --label-color: #121212;
    --menu-bg: #e2e2e2;
    --active-bg: #5898ff;
    --active-bg-dimmed: #c5c5c5;
    outline: none;
    fill: currentColor;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    text-align: left;
    color: var(--label-color);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: 0.007em;
    background: none;
    outline: none;
    width: 100%;
    margin: 0;
    padding: 1px 2px 1px 1px;
    overflow: visible;
    border: 1px solid transparent;
    white-space: nowrap;
}
:host([hidden]) {
    display: none;
}
:host([disabled]) {
    opacity:  .5;
}

:host([active]) {
    color: var(--active-label-color);
}

@media (prefers-color-scheme: dark) {
    :host {
        --label-color: #fff;
        --active-label-color: #000;
        --menu-bg: #525252;
        --active-bg: #5898ff;
        --active-bg-dimmed: #5c5c5;
    }
}</style>`;
const MENU_ITEM_TEMPLATE = document.createElement('template');
MENU_ITEM_TEMPLATE.innerHTML = '<slot></slot>';

/**
 * Each `UIMenuItemElement` is wrapped inside a `<li>` tag.
 * A `UIMenuItemElement` represents the label part of a menu item.
 * Other elements such as the checkmark and the submenu indicator
 * are rendered by the menu container.
 */
export class UIMenuItemElement extends UIElement {
    // The _menuItem is the 'model' corresponding to this element.
    private _menuItem: MenuItem;

    set menuItem(value: MenuItem) {
        this._menuItem = value;
    }
    get menuItem(): MenuItem {
        return this._menuItem;
    }
    constructor() {
        super({ template: MENU_ITEM_TEMPLATE, style: MENU_ITEM_STYLE });
        this.reflectBooleanAttributes([
            'active',
            'separator',
            'disabled',
            'checked',
        ]);
    }
}

export default UIMenuItemElement;

declare global {
    /** @internal */
    export interface Window {
        UIMenuItemElement: typeof UIMenuItemElement;
    }
}

if (!window.customElements.get('ui-menu-item')) {
    window.UIMenuItemElement = UIMenuItemElement;
    window.customElements.define('ui-menu-item', UIMenuItemElement);
}
