import { UIElement } from '../common/ui-element';

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
:host[aria-disabled=true] {
    opacity: .5;
}
:host(:focus), :host(:focus-within) {
    outline: Highlight auto 1px;    /* For Firefox */
    outline: -webkit-focus-ring-color auto 1px;
}

:host.indent {
    margin-left: 12px;
}

:host[role=separator] {
    border-bottom: 1px solid #c7c7c7;
    border-radius: 0;
    padding: 0;
    margin-left: 15px;
    margin-right: 15px;
    padding-top: 5px;
    margin-bottom: 5px;
}

:host([active]) {
    background: var(--active-bg);
    background: -apple-system-control-accent;
    color: var(--active-label-color);
}

:host([active]).is-submenu-open {
    background: var(--active-bg-dimmed);
    color: inherit;
}

:host[aria-haspopup=true]>.label {
     padding-right: 0;
}

:host[aria-haspopup=true].active::after {
    color: white;
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

export class UIMenuItemElement extends UIElement {
    static get observedAttributes(): string[] {
        return ['type'];
    }

    get type(): string {
        return this.hasAttribute('type') ? this.getAttribute('type') : 'normal';
    }

    set type(val: string) {
        if (val) {
            this.setAttribute('type', val);
        } else {
            this.removeAttribute('type');
        }
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
