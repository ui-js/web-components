import { KeyboardModifiers } from '../common/events';
import { MenuItemTemplate, MENU_TEMPLATE } from './menu-core';
import { RootMenu } from './root-menu';

export class UIPopupMenuElement extends HTMLElement {
    private rootMenu: RootMenu;
    constructor(inMenuItems?: MenuItemTemplate[]) {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(MENU_TEMPLATE.content.cloneNode(true));

        // Inline menu items (as a JSON structure in the markup)
        let jsonMenuItems = [];
        try {
            const json = this.shadowRoot
                .querySelector<HTMLSlotElement>('slot:not([name])')
                .assignedElements()
                .filter((x) => x['type'] === 'application/json')
                .map((x) => x.textContent)
                .join('');
            if (json) {
                jsonMenuItems = JSON.parse(json);
                if (!Array.isArray(jsonMenuItems)) {
                    jsonMenuItems = [];
                }
            }
        } catch (e) {
            console.log(e);
        }

        this.rootMenu = new RootMenu(
            [...(inMenuItems ?? []), ...jsonMenuItems],
            {
                host: this.shadowRoot.host,
                root: this.shadowRoot,
            }
        );
    }

    focus(): void {
        super.focus();
        if (this.rootMenu.state !== 'closed') {
            if (this.rootMenu.activeMenuItem) {
                this.rootMenu.activeMenuItem.element.focus();
            } else if (this.rootMenu.firstMenuItem) {
                this.rootMenu.activeMenuItem = this.rootMenu.firstMenuItem;
            } else {
                this.rootMenu.element.focus();
            }
        }
    }

    show(options?: { keyboardModifiers?: KeyboardModifiers }): void {
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');

        this.rootMenu.show(options);
        this.focus();
    }

    hide(): void {
        this.rootMenu.hide();
    }
}

export default UIPopupMenuElement;

declare global {
    /** @internal */
    export interface Window {
        UIPopupMenuElement: typeof UIPopupMenuElement;
    }
}

if (!window.customElements.get('ui-popup-menu')) {
    window.UIPopupMenuElement = UIPopupMenuElement;
    window.customElements.define('ui-popup-menu', UIPopupMenuElement);
}
