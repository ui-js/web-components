import {
    eventLocation,
    keyboardModifiersFromEvent,
    KeyboardModifiers,
    LongPressDetector,
} from '../common/events';
import { UIElement } from '../common/ui-element';
import { MenuItemTemplate } from './menu-core';
import { MENU_TEMPLATE, MENU_STYLE } from './menu-templates';
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
 * Principles of Operation
 *
 * The content of a menu (menu items and submenus) is represented by a 'model',
 * an instance of the Menu class.
 * The model is created from:
 * - argument to the UIContextMenu constructor
 * - setting the `menuItems` property
 * - a `<script>` tag containing a JSON description of menu items
 * - a set of child `<ui-menu-item>` elements.
 *
 * A menu can also have a `<style>` tag, which is applied to style the menu
 * once it is open.
 *
 * The `<ui-context-menu>` and its child elements are kept hidden.
 *
 * When the menu is invoked (with `show()`) a scrim element is created
 * and added as a child of the `<ui-context-menu>`, and a new `<ul>` element
 * is created and attached as a child of the scrim.
 *
 * A set of `<li>` element is added as children of the `<ul>` element, one
 * for each visible menu item, whether this menu item was specified in
 * JSON or with a `<menu-item>` element. The `<li>` element are made of
 * the following components:
 * - a checkmark (optional)
 * - a text label (as a text node, if specified from JSON or as a cloned
 * `UIMenuItemElement` if specified from the `<ui-menu-item>`)
 * - a submenu indicator
 *
 */
export class UIContextMenu extends UIElement {
    private rootMenu: RootMenu;
    // The menu items specified via a constructor or setter
    private templateMenuItems: MenuItemTemplate[];

    private longPressDetector: LongPressDetector;

    constructor(menuItems?: MenuItemTemplate[]) {
        super({
            template: MENU_TEMPLATE,
            style: MENU_STYLE,
        });
        this.templateMenuItems = menuItems ?? [];
    }

    set menuItems(menuItems: MenuItemTemplate[]) {
        this.templateMenuItems = menuItems;
        if (this.rootMenu) {
            this.rootMenu.menuItemTemplates = menuItems;
        }
    }
    get menuItems(): MenuItemTemplate[] {
        return this.templateMenuItems;
    }

    /**
     * @internal
     */
    handleEvent(event: Event): void {
        this.longPressDetector?.dispose();
        this.longPressDetector = undefined;

        if (event.type === 'contextmenu') {
            const evt = event as MouseEvent;
            this.show({
                location: [Math.round(evt.clientX), Math.round(evt.clientY)],
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
                // Get the center of the parent
                const bounds = this.parentElement?.getBoundingClientRect();
                if (bounds) {
                    this.show({
                        location: [
                            Math.round(bounds.left + bounds.width / 2),
                            Math.round(bounds.top + bounds.height / 2),
                        ],
                        keyboardModifiers: keyboardModifiersFromEvent(evt),
                    });
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        } else if (event.type === 'pointerdown') {
            if (event.target === this.shadowRoot.host.parentNode) {
                const pt = eventLocation(event);
                this.longPressDetector = new LongPressDetector(event, () => {
                    this.show({
                        location: pt,
                        keyboardModifiers: keyboardModifiersFromEvent(event),
                    });
                });
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    connectedCallback(): void {
        super.connectedCallback();
        // Listen for contextual menu in the parent
        const parent = this.parentNode;
        parent.addEventListener('contextmenu', this);
        parent.addEventListener('keydown', this);
        parent.addEventListener('pointerdown', this);
    }
    /**
     * Custom elements lifecycle hooks
     * @internal
     */
    disconnectedCallback(): void {
        super.disconnectedCallback();
        const parent = this.parentNode;
        if (parent) {
            parent.removeEventListener('contextmenu', this);
            parent.removeEventListener('keydown', this);
            parent.removeEventListener('pointerdown', this);
        }
    }
    /**
     * @internal
     */
    focus(): void {
        super.focus();
        if (this.rootMenu?.state !== 'closed') {
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
        location?: [x: number, y: number];
        keyboardModifiers?: KeyboardModifiers;
    }): void {
        if (!this.rootMenu) {
            // Import inline (in the component) style sheet
            this.importStyle();

            // Inline menu items (as a JSON structure in a <script> tag
            // in the markup)
            let jsonMenuItems = this.json;
            if (!Array.isArray(jsonMenuItems)) jsonMenuItems = [];
            this.rootMenu = new RootMenu(
                [...this.templateMenuItems, ...jsonMenuItems],
                {
                    host: this.shadowRoot.host,
                    assignedElement: this.shadowRoot.querySelector<HTMLElement>(
                        'ul'
                    ),
                }
            );
        }
        this.style.display = 'block';
        if (this.rootMenu.show({ ...options, parent: this.shadowRoot })) {
            if (!this.hasAttribute('tabindex')) {
                this.setAttribute('tabindex', '-1');
            }
            this.focus();
        } else {
            this.style.display = 'none';
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
        this.rootMenu?.hide();
        this.style.display = 'none';
    }
}

export default UIContextMenu;

declare global {
    /** @internal */
    export interface Window {
        UIContextMenu: typeof UIContextMenu;
    }
}
if (!window.customElements.get('ui-context-menu')) {
    window.UIContextMenu = UIContextMenu;
    window.customElements.define('ui-context-menu', UIContextMenu);
}
