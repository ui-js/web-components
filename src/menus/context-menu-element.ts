import { UIElement } from '../common/ui-element';
import {
    KeyboardModifiers,
    keyboardModifiersFromEvent,
    MenuItemTemplate,
    MENU_TEMPLATE,
    MENU_STYLE,
} from './menu-core';
import { RootMenu } from './root-menu';

/**
 * This web component display a contextual menu when the user performs the
 * appropriate gesture (right-click, control+click, shift+F10, etc...),
 * handles the user interaction to navigate the items in the menu and submenus
 * and either invoke the `onSelect()` hook associated with the selected menu item
 * or dispatches a 'select' event when the user completes their selection.
 *
 * Place this element inside a container and the contextual menu will be
 * displayed when a right-click/control+click/long tap is performed in the
 * container or if the container is keyboard focused when shift+f10 is pressed.
 * In the former case, the menu is diplayed where the click/tap occured.
 * In the later case, the menu is displayed in the center of the parent container.
 *
 * This component is:
 * - screen-reader compatible
 * - keyboard navigable
 * - dark-theme aware
 * - responsive (the menu and submenus will attempt to avoid being displayed
 *   outside of the viewport boundary)
 *
 */
export class UIContextMenuElement extends UIElement {
    private rootMenu: RootMenu;
    constructor(inMenuItems?: MenuItemTemplate[]) {
        super({
            template: MENU_TEMPLATE,
            style: MENU_STYLE,
        });

        // Inline menu items (as a JSON structure in a <script> tag
        // in the markup)
        let jsonMenuItems = this.json;
        if (!Array.isArray(jsonMenuItems)) jsonMenuItems = [];

        this.rootMenu = new RootMenu(
            [...(inMenuItems ?? []), ...jsonMenuItems],
            {
                host: this.shadowRoot.host,
                assignedElement: this.shadowRoot.querySelector<HTMLElement>(
                    'ul'
                ),
            }
        );
    }

    /**
     * @internal
     */
    handleEvent(event: Event): void {
        if (event.type === 'contextmenu') {
            const evt = event as MouseEvent;
            this.show({
                clientX: evt.clientX,
                clientY: evt.clientY,
                keyboardModifiers: keyboardModifiersFromEvent(evt),
            });
            event.preventDefault();
            event.stopPropagation();
        } else if (event.type === 'keydown') {
            const evt = event as KeyboardEvent;
            if (
                evt.code === 'ContextMenu' ||
                (evt.code === 'F10' && evt.shiftKey)
            ) {
                // shift+F10 = contextual menu
                // Get the middle of the parent
                const bounds = this.parentElement?.getBoundingClientRect();
                if (bounds) {
                    this.show({
                        clientX: bounds.left + bounds.width / 2,
                        clientY: bounds.top + bounds.height / 2,
                        keyboardModifiers: keyboardModifiersFromEvent(evt),
                    });
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        } else {
            // @todo press-and-hold
        }
    }
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    connectedCallback(): void {
        // Listen for contextual menu in the parent
        const parent = this.parentNode;
        parent.addEventListener('contextmenu', this);
        parent.addEventListener('keydown', this);
    }
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    disconnectedCallback(): void {
        const parent = this.parentNode;
        if (parent) {
            parent.removeEventListener('contextmenu', this);
            parent.removeEventListener('keydown', this);
        }
    }
    /**
     * @internal
     */
    focus(): void {
        super.focus();
        if (this.rootMenu.state !== 'closed') {
            if (this.rootMenu.activeMenuItem) {
                this.rootMenu.activeMenuItem.element.focus();
            } else {
                this.rootMenu.element.focus();
            }
        }
    }
    /**
     * Display the menu at the specified location.
     * If provided, the `keyboardModifiers` option can change what commands
     * are visible, enabled, or what their label is.
     *
     * The contextual menu is shown automatically when the appropriate UI gesture
     * is performed by the user (right-click, shift+F10, etc...). This method
     * only needs to be called to trigger the menu manually (for example to
     * trigger it on click of an item).
     */
    show(options?: {
        clientX?: number;
        clientY?: number;
        keyboardModifiers?: KeyboardModifiers;
    }): void {
        if (this.rootMenu.show({ ...options, parent: this.shadowRoot })) {
            if (!this.hasAttribute('tabindex')) {
                this.setAttribute('tabindex', '-1');
            }
            this.style.display = 'block';
            this.focus();
        }
    }
    /**
     * Hide the menu.
     *
     * The visibility of the menu is typically controlled by the user
     * interaction: the menu is automatically hidden if the user release the
     * mouse button, or after having selected a command. This is a manual
     * override that should be very rarely needed.
     */
    hide(): void {
        this.rootMenu.hide();
    }
}

export default UIContextMenuElement;

declare global {
    /** @internal */
    interface Window {
        UIContextMenuElement: typeof UIContextMenuElement;
    }
}
if (!window.customElements.get('ui-context-menu')) {
    window.UIContextMenuElement = UIContextMenuElement;
    window.customElements.define('ui-context-menu', UIContextMenuElement);
}