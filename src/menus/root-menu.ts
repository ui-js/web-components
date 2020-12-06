import {
    equalKeyboardModifiers,
    KeyboardModifiers,
    keyboardModifiersFromEvent,
    mightProducePrintableCharacter,
} from '../common/events';
import { Scrim } from '../common/scrim';
import { Menu, MenuItemTemplate } from './menu-core';

export class RootMenu extends Menu {
    lastMoveEvent: PointerEvent;

    private typingBufferResetTimer: number;
    private typingBuffer: string;
    private _scrim: Scrim;
    private _openTimestamp: number;
    private currentKeyboardModifiers: KeyboardModifiers;
    private hysteresisTimer: number;
    /**
     * The host is used to dispatch events from
     */
    private _host: Element;
    /**
     * - 'closed': the menu is not visible
     * - 'open': the menu is visible as long as the mouse button is pressed
     * - 'modal': the menu is visible until dismissed, even with the mouse button
     * released
     */
    state: 'closed' | 'open' | 'modal';

    /** If true, the state of some of the menu items in this menu are
     * provide by a function and may need to be updated dynamically
     */
    isDynamic: boolean;

    /**
     * If an `options.element` is provided, the root menu is
     * attached to that element (the element will be modified
     * to display the menu). Use this when using a popup menu.
     * In this mode, call `show()` and `hide()` to control the
     * display of the menu.
     *
     * Otherwise, if `options.element` is undefined, use `.element` to get
     * back an element representing the menu, and attach this element where
     * appropriate. Use this when displaying the menu inline.
     */
    constructor(
        menuItems?: MenuItemTemplate[],
        options?: {
            root?: Node;
            host?: Element;
            keyboardModifiers?: KeyboardModifiers;
            assignedElement?: HTMLElement;
        }
    ) {
        super(menuItems, { assignedContainer: options?.assignedElement });
        this.isDynamic = menuItems.some(isDynamic);
        this.currentKeyboardModifiers = options?.keyboardModifiers;
        this.typingBuffer = '';
        this.state = 'closed';

        this._scrim = new Scrim({
            dismissOnClick: true,
            onHide: () => this.hide(),
        });

        this._host = options?.host;
    }

    get host(): Element {
        return this._host;
    }

    /**
     * The currently active menu: could be the root menu or a submenu
     */
    get activeMenu(): Menu {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let result: Menu = this;
        while (result.isSubmenuOpen) {
            result = result.activeMenuItem.submenu;
        }
        return result;
    }

    handleKeyupEvent(ev: KeyboardEvent): void {
        if (this.isDynamic) {
            const newModifiers = keyboardModifiersFromEvent(ev);
            if (
                !equalKeyboardModifiers(
                    this.currentKeyboardModifiers,
                    newModifiers
                )
            ) {
                this.updateMenu(newModifiers);
                this.currentKeyboardModifiers = newModifiers;
            }
        }
    }
    handleKeydownEvent(ev: KeyboardEvent): void {
        if (ev.key === 'Tab') {
            // Close and bubble
            this.rootMenu.hide();
            return;
        }

        if (this.isDynamic) {
            const newModifiers = keyboardModifiersFromEvent(ev);
            if (
                !equalKeyboardModifiers(
                    this.currentKeyboardModifiers,
                    newModifiers
                )
            ) {
                this.updateMenu(newModifiers);
                this.currentKeyboardModifiers = newModifiers;
            }
        }

        let handled = true;
        const menu = this.activeMenu;
        const menuItem = menu.activeMenuItem;
        switch (ev.key) {
            case ' ':
            case 'Space':
            case 'Return':
            case 'Enter':
                menuItem?.select(keyboardModifiersFromEvent(ev));
                break;
            case 'ArrowRight':
                if (menuItem?.submenu) {
                    menuItem.select(keyboardModifiersFromEvent(ev));
                    this.activeMenu.activeMenuItem = this.activeMenu.firstMenuItem;
                } else if (!menuItem) {
                    menu.activeMenuItem = menu.firstMenuItem;
                }
                break;
            case 'ArrowLeft':
                if (menu === this.rootMenu) {
                    if (!menuItem) {
                        menu.activeMenuItem = menu.firstMenuItem;
                    }
                } else {
                    menu.hide();
                    const el = menu.parentMenu.activeMenuItem.element;
                    el.focus();
                    el.classList.remove('is-submenu-open');
                }
                break;
            case 'ArrowDown':
                menu.activeMenuItem = menu.nextMenuItem(+1);
                break;
            case 'ArrowUp':
                menu.activeMenuItem = menu.nextMenuItem(-1);
                break;
            case 'Home':
            case 'PageUp':
                menu.activeMenuItem = menu.firstMenuItem;
                break;
            case 'End':
            case 'PageDown':
                menu.activeMenuItem = menu.lastMenuItem;
                break;
            case 'Escape':
                this.rootMenu.hide();
                break;
            case 'Backspace':
                if (this.typingBuffer) {
                    this.typingBuffer = this.typingBuffer.slice(0, -1);
                    if (this.typingBuffer) {
                        clearTimeout(this.typingBufferResetTimer);
                        const newItem = menu.findMenuItem(this.typingBuffer);
                        if (newItem) menu.activeMenuItem = newItem;

                        this.typingBufferResetTimer = setTimeout(() => {
                            this.typingBuffer = '';
                        }, 500);
                    }
                }
                break;
            default:
                if (mightProducePrintableCharacter(ev)) {
                    if (isFinite(this.typingBufferResetTimer)) {
                        clearTimeout(this.typingBufferResetTimer);
                    }
                    this.typingBuffer += ev.key;
                    const newItem = menu.findMenuItem(this.typingBuffer);
                    if (newItem) menu.activeMenuItem = newItem;

                    this.typingBufferResetTimer = setTimeout(() => {
                        this.typingBuffer = '';
                    }, 500);
                } else {
                    handled = false;
                }
        }
        if (handled) {
            ev.preventDefault();
            ev.stopPropagation();
        }
    }

    handleEvent(event: Event): void {
        if (event.type === 'keydown') {
            this.handleKeydownEvent(event as KeyboardEvent);
        } else if (event.type === 'keyup') {
            this.handleKeyupEvent(event as KeyboardEvent);
        } else if (event.type === 'pointermove') {
            this.lastMoveEvent = event as PointerEvent;
        } else if (event.type === 'pointerup' && event.target === this.scrim) {
            if (
                isFinite(this.rootMenu._openTimestamp) &&
                Date.now() - this.rootMenu._openTimestamp < 120
            ) {
                // Hold mode...
                this.state = 'modal';
            } else {
                // Cancel
                this.hide();
            }
        } else if (event.type === 'contextmenu') {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    private get scrim(): HTMLElement {
        return this._scrim.element;
    }

    private connectScrim(root: Node): void {
        const scrim = this.scrim;
        scrim.addEventListener('pointerup', this);

        scrim.addEventListener('contextmenu', this);

        scrim.addEventListener('keydown', this);
        scrim.addEventListener('keyup', this);
        scrim.addEventListener('pointermove', this);

        this._scrim.show({ root });
    }

    private disconnectScrim(): void {
        const scrim = this.scrim;
        scrim.removeEventListener('pointerup', this);

        scrim.removeEventListener('contextmenu', this);

        scrim.removeEventListener('keydown', this);
        scrim.removeEventListener('keyup', this);
        scrim.removeEventListener('pointermove', this);
        this._scrim.hide();
    }

    get rootMenu(): RootMenu {
        // I AM THE ONE WHO KNOCKS
        return this;
    }

    show(options?: {
        clientX?: number;
        clientY?: number;
        parent?: Node; // Where the menu should attach
        keyboardModifiers?: KeyboardModifiers;
    }): boolean {
        if (super.show({ ...options, parent: this.scrim })) {
            // Record the opening time.
            // If we receive a mouseup within a small delta of the open time stamp
            // hold the menu open until it is dismissed, otherwise close it.
            this._openTimestamp = Date.now();
            this.state = 'open';

            this.connectScrim(options?.parent);
            // Note: any attempt at focusing before
            // connecting the scrim would have been a no-op
            // Focus now.
            this.element.focus();
            return true;
        }
        return false;
    }

    hide(): void {
        this.cancelDelayedOperation();
        if (this.state !== 'closed') {
            this.activeMenuItem = null;
            super.hide();
            this.state = 'closed';
            this.disconnectScrim();
        }
    }

    scheduleOperation(fn: () => void): void {
        this.cancelDelayedOperation();

        const delay = this.submenuHysteresis;
        if (delay <= 0) {
            fn();
            return;
        }
        this.hysteresisTimer = setTimeout(() => {
            this.hysteresisTimer = undefined;
            fn();
        }, delay);
    }

    cancelDelayedOperation(): void {
        if (this.hysteresisTimer) {
            clearTimeout(this.hysteresisTimer);
            this.hysteresisTimer = undefined;
        }
    }

    /**
     * Delay (in milliseconds) before displaying a submenu.
     * Prevents distracting "flashing" of submenus when moving through the
     * options in a menu.
     */
    get submenuHysteresis(): number {
        return 120;
    }
}

function isDynamic(item: MenuItemTemplate): boolean {
    const result =
        typeof item.disabled === 'function' ||
        typeof item.hidden === 'function' ||
        typeof item.checked === 'function' ||
        typeof item.label === 'function' ||
        typeof item.ariaDetails === 'function' ||
        typeof item.ariaLabel === 'function';

    if (item.type === 'submenu' && item.submenu) {
        return result || item.submenu.some(isDynamic);
    }
    return result;
}
