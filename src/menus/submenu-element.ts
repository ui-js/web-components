import { UIElement } from '../common/ui-element';
import { MENU_STYLE, MENU_TEMPLATE } from './menu-templates';

/**
 * Use `<ui-submenu>` as a child of a `<ui-menuitem>`.
 *
 * This element is used as a "template" for a submenu when a
 * menu is displayed: it displays nothing by itself.
 *
 * It can include a `<style>` tag.
 */
export class UISubmenuElement extends UIElement {
    constructor() {
        super({
            template: MENU_TEMPLATE,
            style: MENU_STYLE,
        });
    }
}

export default UISubmenuElement;

declare global {
    /** @internal */
    export interface Window {
        UISubmenuElement: typeof UISubmenuElement;
    }
}
if (!window.customElements.get('ui-submenu')) {
    window.UISubmenuElement = UISubmenuElement;
    window.customElements.define('ui-submenu', UISubmenuElement);
}
