import { RootMenu } from './root-menu';

export const MENU_TEMPLATE = document.createElement('template');
MENU_TEMPLATE.innerHTML = `<style>
:host {
    display: block;
    color-scheme: light dark;
    --active-label-color: #fff;
    --label-color: #121212;
    --menu-bg: #e2e2e2;
    --active-bg: #5898ff;
    --active-bg-dimmed: #c5c5c5;
}
:host([hidden]) {
    display: none;
}
:host([disabled]) {
    opacity:  .5;
}
:host(:focus), :host(:focus-within) {
    outline: Highlight auto 1px;    /* For Firefox */
    outline: -webkit-focus-ring-color auto 1px;
}
:host div.scrim {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    /* z-index: 9999; */
    outline: none;
    background: transparent;
}
ul.menu-container {
    position: absolute;
    width: auto;
    z-index: 10000;
    border-radius: 8px;
    background: var(--menu-bg);
    box-shadow: 0 0 2px rgba(0, 0, 0, .5), 0 0 20px rgba(0, 0, 0, .2);

    list-style: none;
    padding: 6px 0 6px 0;
    margin: 0;
    cursor: initial;
    user-select: none;
    color: var(--label-color);
    outline: none;
}
ul > li {
    display: flex;
    flex-flow: row;
    align-items: center;
    padding: 1px 7px 1px 7px;
    margin-top: 0;
    margin-left: 6px;
    margin-right: 6px;
    border-radius: 4px;
    white-space: nowrap;
    position: relative;
    outline: none;
    fill: currentColor;
}
ul > li > .label {
    appearance: none;
    background: none;
    outline: none;
    width: 100%;
    margin: 0;
    padding: 1px 2px 1px 1px;
    text-align: left;
    color: inherit;
    overflow: visible;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    border: 1px solid transparent;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 13px;
    line-height: 16px;
    letter-spacing: 0.007em;
}
ul > li[role=separator] {
    border-bottom: 1px solid #c7c7c7;
    border-radius: 0;
    padding: 0;
    margin-left: 15px;
    margin-right: 15px;
    padding-top: 5px;
    margin-bottom: 5px;
}
ul > li[aria-disabled=true] {
    opacity: .5;
}

ul > li.active {
    background: var(--active-bg);
    background: -apple-system-control-accent;
    color: var(--active-label-color);
}

ul > li.active.is-submenu-open {
    background: var(--active-bg-dimmed);
    color: inherit;
}

ul > li[aria-haspopup=true]>.label {
     padding-right: 0;
}

.right-chevron {
    margin-left: 24px;
    width: 10px;
    height: 10px;
    padding-bottom: 9px;
}

ul > li[aria-haspopup=true].active::after {
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
}
</style>
<div></div><slot style="display:none"></slot>`;

export type KeyboardModifiers = {
    alt: boolean;
    control: boolean;
    shift: boolean;
    meta: boolean;
};

export type MenuItemTemplate = {
    onClick?: (menuItem: MenuItem, kbd?: KeyboardModifiers) => void;
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    className?: string;
    label?:
        | string
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => string);
    ariaLabel?:
        | string
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => string);
    ariaDetails?:
        | string
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => string);
    // sublabel?: string;
    // tooltip?: string;
    // accelerator?: string;
    // icon?: string;
    submenu: MenuItemTemplate[];
    id?: string;

    visible?:
        | boolean
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => boolean);
    enabled?:
        | boolean
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => boolean);
    checked?:
        | boolean
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => boolean);
};

/**
 * An instance of `Menu` is a set of menu items, including submenus.
 */
export class Menu {
    parentMenu: Menu;

    protected _element: HTMLElement;
    protected _menuItems: MenuItem[];
    private _activeMenuItem: MenuItem;
    isSubmenuOpen: boolean; // If tru, _activeMenuItem.submenu is open

    /*
     * The menu items template are preserved so that the actual menu items
     * can be recalculated, for example if the keyboard modifiers change.
     * (when isDynamic is true)
     */
    private _menuItemsTemplate: MenuItemTemplate[] | undefined;

    constructor(
        menuItems?: MenuItemTemplate[],
        options?: {
            parentMenu?: Menu;
        }
    ) {
        this.parentMenu = options?.parentMenu ?? null;

        this._menuItemsTemplate = menuItems;
        this.isSubmenuOpen = false;
    }

    get rootMenu(): RootMenu {
        return this.parentMenu?.rootMenu;
    }

    get host(): Element {
        return this.rootMenu.host;
    }

    updateMenu(keyboardModifiers?: KeyboardModifiers): void {
        // The state of the keyboard modifiers has changed and the menu
        // is dynamic: recalculate the menu
        // Save the current menu item
        const elem = this._element;
        let saveCurrentItem: number;
        let clientX: string;
        let clientY: string;
        let parent: Node;
        if (elem) {
            // If there is a cached element for this menu,
            // remove it (but save its state)
            saveCurrentItem = this._menuItems.indexOf(this.activeMenuItem);
            parent = elem.parentNode;
            clientX = elem.style.left;
            clientY = elem.style.top;
            parent?.removeChild(elem);
            this._element = null;
        }

        this._menuItems = [];
        if (!this._menuItemsTemplate) return;
        this._menuItemsTemplate.forEach((x) =>
            this.appendMenuItem(x, keyboardModifiers)
        );

        if (elem) {
            // If there was an element, restore it and its state
            parent?.appendChild(this.element);

            this.element.style.position = 'absolute';
            this.element.style.top = clientY;
            this.element.style.left = clientX;

            this.activeMenuItem = this.at(saveCurrentItem);
            if (this.activeMenuItem?.submenu) {
                this.activeMenuItem.openSubmenu(keyboardModifiers);
            }
        }
    }

    at(index: number): MenuItem {
        return this._menuItems[index];
    }

    /** First activable menu item */
    get firstMenuItem(): MenuItem {
        let result = 0;
        let found = false;
        while (!found && result <= this._menuItems.length - 1) {
            const item = this.at(result);
            found = item.type !== 'separator' && item.visible && item.enabled;
            result += 1;
        }

        return !found ? null : this.at(result - 1);
    }
    /** Last activable menu item */
    get lastMenuItem(): MenuItem {
        let result = this._menuItems.length - 1;
        let found = false;
        while (!found && result >= 0) {
            const item = this.at(result);
            found = item.type !== 'separator' && item.visible && item.enabled;
            result -= 1;
        }

        return !found ? null : this.at(result + 1);
    }
    /**
     * The active menu is displayed on a colored background.
     */
    get activeMenuItem(): MenuItem {
        return this._activeMenuItem;
    }

    /**
     * Set to undefined to have no active item.
     * Note that setting the active menu item doesn't automatically
     * open the submenu (e.g. when keyboard navigating).
     * Call `item.submenu.openSubmenu()` to open the submenu.
     */
    set activeMenuItem(value: MenuItem) {
        this.parentMenu?.rootMenu.cancelDelayedOperation();
        if (value !== this._activeMenuItem) {
            // Remove previously active element
            if (this.activeMenuItem) {
                const item = this.activeMenuItem;
                item.element.classList.remove('active');
                // If there is a submenu, hide it
                item.submenu?.hide();
            }

            if (!value?.visible) {
                this._activeMenuItem = undefined;
                return;
            }

            this._activeMenuItem = value;

            // Make new element active
            value?.element.classList.add('active');
        }
        value?.element.focus();

        // Update secondary state of parent
        this.parentMenu?.activeMenuItem?.element.classList.toggle(
            'is-submenu-open',
            !!value
        );
    }

    nextMenuItem(dir: number): MenuItem {
        if (!this._activeMenuItem && dir > 0) return this.firstMenuItem;
        if (!this._activeMenuItem && dir < 0) return this.lastMenuItem;
        const first = this._menuItems.indexOf(this.firstMenuItem);
        const last = this._menuItems.indexOf(this.lastMenuItem);
        let found = false;
        let result = this._menuItems.indexOf(this._activeMenuItem) + dir;
        while (!found && result >= first && result <= last) {
            const item = this.at(result);
            found = item.type !== 'separator' && item.visible && item.enabled;
            result += dir;
        }
        return found
            ? this.at(result - dir)
            : dir > 0
            ? this.lastMenuItem
            : this.firstMenuItem;
    }

    static _collator: Intl.Collator;

    static get collator(): Intl.Collator {
        if (Menu._collator) return Menu._collator;
        Menu._collator = new Intl.Collator(undefined, {
            usage: 'search',
            sensitivity: 'base',
        });
        return Menu._collator;
    }
    findMenuItem(text: string): MenuItem {
        const candidates = this._menuItems.filter(
            (x) => x.type !== 'separator' && x.visible && x.enabled
        );
        if (candidates.length === 0) return null;
        const last =
            Math.max(...candidates.map((x) => x.label.length)) - text.length;

        if (last < 0) return null;

        // Find a "contain" match
        let result: MenuItem;
        let i = 0;
        while (i < last && !result) {
            result = candidates.find(
                (x) =>
                    Menu.collator.compare(
                        text,
                        x.label.substr(i, text.length)
                    ) === 0
            );
            i++;
        }
        return result;
    }

    get element(): HTMLElement {
        if (this._element) return this._element;

        const ul = document.createElement('ul');
        ul.className = 'menu-container';
        ul.setAttribute('tabindex', '-1');
        ul.setAttribute('role', 'menu');
        ul.setAttribute('aria-orientation', 'vertical');

        this._menuItems.forEach((x) => {
            const elem = x.element;
            if (elem) ul.appendChild(elem);
        });
        ul.querySelector('li:first-of-type')?.setAttribute('tabindex', '0');

        this._element = ul;
        return this._element;
    }

    /**
     * @param parent: where the menu should be attached
     */
    show(options?: {
        parent: Node;
        clientX?: number;
        clientY?: number;
        keyboardModifiers?: KeyboardModifiers;
    }): void {
        this.updateMenu(options?.keyboardModifiers);
        options?.parent?.appendChild(this.element);

        if (isFinite(options?.clientY) && isFinite(options?.clientY)) {
            this.element.style.position = 'absolute';
            this.element.style.top = Number(options.clientY).toString() + 'px';
            this.element.style.left = Number(options.clientX).toString() + 'px';
        }

        this.element.focus();

        // Notify our parent we have opened
        // (so the parent can close any other open submenu and/or
        // change its state to display the active state correctly)
        if (this.parentMenu) {
            this.parentMenu.openSubmenu = this;
        }
    }

    hide(): void {
        // Hide any of our child submenus
        this.openSubmenu = null;

        this.activeMenuItem = undefined;

        // Notify our parent
        if (this.parentMenu) {
            this.parentMenu.openSubmenu = null;
        }

        this._element?.parentNode?.removeChild(this._element);
        this._element = null;
    }

    /**
     * This method is called to record that one of our submenus has opened.
     * To open a submenu call openSubmenu() on the item with the submenu
     * or show() on the submenu.
     */
    set openSubmenu(submenu: Menu) {
        const expanded = submenu !== null;
        // We're closing a submenu
        if (this.activeMenuItem?.type === 'submenu') {
            this.activeMenuItem.element?.setAttribute(
                'aria-expanded',
                expanded.toString()
            );
        }
        this.isSubmenuOpen = expanded;
    }

    getMenuItemById(id: string): MenuItem | null {
        let result = null;
        this._menuItems.forEach((x) => {
            if (x.id === id) {
                result = x;
            } else if (x.submenu) {
                result = x.submenu.getMenuItemById(id);
            }
        });
        return result;
    }

    appendMenuItem(
        menuItem: MenuItemTemplate,
        keyboardModifiers: KeyboardModifiers
    ): void {
        this.insertMenuItem(-1, menuItem, keyboardModifiers);
    }

    insertMenuItem(
        pos: number,
        menuItem: MenuItemTemplate,
        keyboardModifiers: KeyboardModifiers
    ): void {
        if (pos < 0) pos = Math.max(0, this._menuItems.length - 1);

        const item = new MenuItem(menuItem, this, {
            keyboardModifiers: keyboardModifiers,
        });

        this._menuItems.splice(pos + 1, 0, item);
    }
}

//
//
//

const PRINTABLE_KEYCODE = [
    'Backquote', // Japanese keyboard: hankaku/zenkaku/kanji key, which is non-printable
    'Digit0',
    'Digit1',
    'Digit2',
    'Digit3',
    'Digit4',
    'Digit5',
    'Digit6',
    'Digit7',
    'Digit8',
    'Digit9',
    'Minus',
    'Equal',
    'IntlYen', // Japanese Keyboard. Russian keyboard: \/

    'KeyQ', // AZERTY keyboard: labeled 'a'
    'KeyW', // AZERTY keyboard: labeled 'z'
    'KeyE',
    'KeyR',
    'KeyT',
    'KeyY', // QWERTZ keyboard: labeled 'z'
    'KeyU',
    'KeyI',
    'KeyO',
    'KeyP',
    'BracketLeft',
    'BracketRight',
    'Backslash', // May be labeled #~ on UK 102 keyboard
    'KeyA', // AZERTY keyboard: labeled 'q'
    'KeyS',
    'KeyD',
    'KeyF',
    'KeyG',
    'KeyH',
    'KeyJ',
    'KeyK',
    'KeyL',
    'Semicolon',
    'Quote',
    'IntlBackslash', // QWERTZ keyboard '><'
    'KeyZ', // AZERTY: 'w', QWERTZ: 'y'
    'KeyX',
    'KeyC',
    'KeyV',
    'KeyB',
    'KeyN',
    'KeyM',
    'Comma',
    'Period',
    'Slash',
    'IntlRo', // Japanse keyboard '\ろ'

    'Space',

    'Numpad0',
    'Numpad1',
    'Numpad2',
    'Numpad3',
    'Numpad4',
    'Numpad5',
    'Numpad6',
    'Numpad7',
    'Numpad8',
    'Numpad9',
    'NumpadAdd',
    'NumpadComma',
    'NumpadDecimal',
    'NumpadDivide',
    'NumpadEqual',
    'NumpadHash',
    'NumpadMultiply',
    'NumpadParenLeft',
    'NumpadParenRight',
    'NumpadStar',
    'NumpadSubstract',
];

export function keyboardModifiersFromEvent(
    ev: MouseEvent | KeyboardEvent
): KeyboardModifiers {
    const result = {
        alt: false,
        control: false,
        shift: false,
        meta: false,
    };
    if (ev.altKey) result.alt = true;
    if (ev.ctrlKey) result.control = true;
    if (ev.metaKey) result.meta = true;
    if (ev.shiftKey) result.shift = true;
    return result;
}

export function distance(dx: number, dy: number): number {
    return Math.sqrt(dx * dx + dy * dy);
}

export function evalToBoolean(
    item: MenuItemTemplate,
    value:
        | boolean
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => boolean),
    keyboardModifiers?: KeyboardModifiers
): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'function') {
        return value(item, keyboardModifiers);
    }
    return undefined;
}

export function evalToString(
    item: MenuItemTemplate,
    value:
        | string
        | ((
              item: MenuItemTemplate,
              keyboardModifiers?: KeyboardModifiers
          ) => string),
    options: {
        keyboardModifiers?: KeyboardModifiers;
    }
): string {
    if (typeof value === 'string') {
        return value;
    } else if (typeof value === 'function') {
        return value(item, options.keyboardModifiers);
    }
    return undefined;
}

export function equalKeyboardModifiers(
    a: KeyboardModifiers,
    b: KeyboardModifiers
): boolean {
    if ((!a && b) || (a && !b)) return false;
    return (
        a.alt === b.alt &&
        a.control === b.control &&
        a.shift === b.shift &&
        a.meta === b.meta
    );
}

export function mightProducePrintableCharacter(evt: KeyboardEvent): boolean {
    if (evt.ctrlKey || evt.metaKey) {
        // ignore ctrl/cmd-combination but not shift/alt-combinations
        return false;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
    if (evt.key === 'Dead') return false;

    // When issued via a composition, the `code` field is empty
    if (evt.code === '') return true;

    return PRINTABLE_KEYCODE.indexOf(evt.code) >= 0;
}

const CHEVRON_RIGHT_TEMPLATE = document.createElement('template');
CHEVRON_RIGHT_TEMPLATE.innerHTML = `<span aria-hidden="true" class="right-chevron"><svg focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg></span>`;

export type MenuSelectEvent = {
    menuItem: MenuItem;
    keyboardModifiers: KeyboardModifiers;
};

declare global {
    /**
     * Map the custom event names to types
     * @internal
     */
    interface DocumentEventMap {
        ['select']: CustomEvent<MenuSelectEvent>;
    }
}

export class MenuItem {
    type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    className?: string;
    label?: string;
    ariaLabel?: string;
    ariaDetails?: string;
    enabled: boolean;
    visible: boolean;
    checked?: boolean;
    onClick?: (menuItem: MenuItem, kbd?: KeyboardModifiers) => void;
    // sublabel?: string;
    // tooltip?: string;
    // accelerator?: string;
    // icon?: string;
    submenu?: Menu;
    id?: string;

    _element: HTMLElement;
    parentMenu: Menu;

    constructor(
        template: MenuItemTemplate,
        parentMenu: Menu,
        options?: {
            keyboardModifiers?: KeyboardModifiers;
        }
    ) {
        this.enabled =
            evalToBoolean(
                template,
                template.enabled,
                options?.keyboardModifiers
            ) ?? true;
        this.visible =
            evalToBoolean(
                template,
                template.visible,
                options?.keyboardModifiers
            ) ?? true;
        this.checked =
            evalToBoolean(
                template,
                template.checked,
                options?.keyboardModifiers
            ) ?? false;
        this.parentMenu = parentMenu;

        this.id = template.id;
        this.className = template.className;
        this.label = evalToString(template, template.label, options);
        this.ariaLabel = evalToString(template, template.ariaLabel, options);
        this.ariaDetails = evalToString(
            template,
            template.ariaDetails,
            options
        );

        if (Array.isArray(template.submenu)) {
            this.type = 'submenu';
            this.submenu = new Menu(template.submenu, {
                parentMenu,
            });
        } else {
            this.type = template.type ?? 'normal';
        }
    }

    handleEvent(event: Event): void {
        if (event.type === 'mouseenter') {
            console.log('entering ', this.label);
            const ev = event as MouseEvent;
            this.parentMenu.rootMenu.cancelDelayedOperation();
            // If there is a submenu open, and the mouse is moving in the
            // triangle formed from the current mouse location and the two
            // adjacent corners of the open menu, schedule setting the new
            // active menuitem to later
            if (
                this.parentMenu.isSubmenuOpen &&
                this.parentMenu.activeMenuItem?.movingTowardSubmenu(ev)
            ) {
                this.parentMenu.rootMenu.scheduleOperation(() => {
                    this.parentMenu.activeMenuItem = this;
                    if (this.submenu) {
                        this.openSubmenu(keyboardModifiersFromEvent(ev));
                    }
                });
            } else {
                this.parentMenu.activeMenuItem = this;
                if (this.submenu) {
                    this.openSubmenu(keyboardModifiersFromEvent(ev), {
                        withDelay: true,
                    });
                }
            }
        } else if (event.type === 'mouseleave') {
            if (this.parentMenu.rootMenu.activeMenu === this.parentMenu) {
                this.parentMenu.activeMenuItem = null;
            }
        } else if (event.type === 'mouseup') {
            const ev = event as MouseEvent;
            // when modal, the items are activated on click,
            // so ignore mouseup
            if (this.parentMenu.rootMenu.state !== 'modal') {
                this.select(keyboardModifiersFromEvent(ev));
            }
            ev.stopPropagation();
            ev.preventDefault();
        }
    }

    private render(): HTMLElement | null {
        if (!this.visible) return null;

        if (this.type === 'separator') {
            const li = document.createElement('li');
            li.setAttribute('role', 'separator');
            return li;
        }

        if (
            this.type !== 'normal' &&
            this.type !== 'submenu' &&
            this.type !== 'radio' &&
            this.type !== 'checkbox'
        ) {
            return null;
        }
        const li = document.createElement('li');
        if (this.className) {
            li.className = this.className;
        }
        li.setAttribute('tabindex', '-1');
        if (this.type === 'radio') {
            li.setAttribute('role', 'menuitemradio');
        } else if (this.type === 'checkbox') {
            li.setAttribute('role', 'menuitemcheckbox');
        } else {
            li.setAttribute('role', 'menuitem');
        }
        if (this.checked) {
            li.setAttribute('aria-checked', 'true');
        }
        if (this.type === 'submenu') {
            li.setAttribute('aria-haspopup', 'true');
            li.setAttribute('aria-expanded', 'false');
        }
        if (this.ariaLabel) li.setAttribute('aria-label', this.ariaLabel);
        if (this.ariaDetails) li.setAttribute('aria-label', this.ariaDetails);

        if (!this.enabled) {
            li.setAttribute('aria-disabled', 'true');
        } else {
            li.addEventListener('mouseenter', this);
            li.addEventListener('mouseleave', this);
            li.addEventListener('mouseup', this);
        }

        const span = document.createElement('span');
        span.innerHTML = this.label;
        span.className = 'label';
        if (this.enabled) {
            span.addEventListener('click', (ev: MouseEvent) =>
                this.select(keyboardModifiersFromEvent(ev))
            );
        }
        li.appendChild(span);
        if (this.submenu) {
            li.appendChild(CHEVRON_RIGHT_TEMPLATE.content.cloneNode(true));
        }
        return li;
    }

    get element(): HTMLElement {
        if (this._element) return this._element;
        this._element = this.render();
        return this._element;
    }

    get host(): Element {
        return this.parentMenu.host;
    }

    /**
     * Called when a menu item is selected:
     * - either dismiss the menu and execute the command
     * - or display the submenu
     */
    select(kbd?: KeyboardModifiers): void {
        this.parentMenu.rootMenu.cancelDelayedOperation();
        if (
            this.type === 'normal' ||
            this.type === 'radio' ||
            this.type === 'checkbox'
        ) {
            // Make the item blink, then execute the command
            setTimeout(() => {
                this.element.classList.remove('active');
                setTimeout(() => {
                    this.element.classList.add('active');
                    setTimeout(() => {
                        this.parentMenu.rootMenu.hide();
                        setTimeout(() => {
                            if (this.onClick) {
                                this.onClick(this, kbd);
                            } else {
                                this.host.dispatchEvent(
                                    new CustomEvent<MenuSelectEvent>('select', {
                                        detail: {
                                            menuItem: this,
                                            keyboardModifiers: kbd,
                                        },
                                    })
                                );
                            }
                        }, 120);
                    }, 120);
                }, 120);
            }, 120);
        } else if (this.type === 'submenu') {
            this.openSubmenu(kbd);
        }
    }

    /**
     * Open the submenu of this menu item, with a delay if options.delay
     * This delay improves targeting of submenus with the mouse.
     */
    openSubmenu(
        kbd: KeyboardModifiers,
        options?: { withDelay: boolean }
    ): void {
        if (options?.withDelay ?? false) {
            this.parentMenu.rootMenu.scheduleOperation(() =>
                this.openSubmenu(kbd)
            );
            return;
        }
        const maxWidth = window.document.documentElement.clientWidth;
        const maxHeight = window.document.documentElement.clientHeight;
        const bounds = this.element.getBoundingClientRect();

        // Update the items of the submenu so we can lay it out and measure it
        this.submenu.updateMenu(kbd);
        this.element.appendChild(this.submenu.element);
        const submenuBounds = this.submenu.element.getBoundingClientRect();
        this.element.removeChild(this.submenu.element);

        let clientX = bounds.width;
        let clientY = -4;
        if (bounds.right + submenuBounds.width > maxWidth) {
            // Need to adjust horizontally
            clientX = -submenuBounds.width;
        }
        if (bounds.top - 4 + submenuBounds.height > maxHeight) {
            // Need to adjust vertically
            clientY = -4 - (submenuBounds.height - (maxHeight - bounds.top));
        }
        this.submenu.show({
            clientX,
            clientY,
            parent: this.element,
            keyboardModifiers: kbd,
        });
    }

    movingTowardSubmenu(ev: MouseEvent): boolean {
        const lastEv = this.parentMenu.rootMenu.lastMouseEvent;
        if (!lastEv) return false;
        const deltaT = ev.timeStamp - lastEv.timeStamp;
        if (deltaT > 500) return false;

        let position: 'left' | 'right' = 'right';
        if (this.submenu.element) {
            const submenuBounds = this.submenu.element.getBoundingClientRect();

            const bounds = this.element.getBoundingClientRect();
            if (submenuBounds.left < bounds.left + bounds.width / 2) {
                position = 'left';
            }
        }

        const deltaX = ev.clientX - lastEv.clientX;
        const s = speed(deltaX, lastEv.clientY - ev.clientY, deltaT);
        if (position === 'right') {
            return deltaX > 0 && s > 0.2;
        }

        return false;
    }
}

function speed(dx: number, dy: number, dt: number): number {
    return Math.sqrt(dx * dx + dy * dy) / dt;
}
