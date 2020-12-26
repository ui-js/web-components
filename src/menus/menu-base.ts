import {
    keyboardModifiersFromEvent,
    KeyboardModifiers,
} from '../common/events';

/**
 * Base class to represent a menu item.
 * There are two subclasses:
 * - MenuItemFromTemplate for menu items created from a JSON template
 * - MenuItemFromElement for menu items created for a UIMenuItemElement
 */
export abstract class MenuItem {
    parentMenu: MenuInterface;
    submenu?: MenuInterface;

    constructor(parentMenu: MenuInterface) {
        this.parentMenu = parentMenu;
    }

    handleEvent(event: Event): void {
        if (event.type === 'pointerenter') {
            const ev = event as PointerEvent;
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
        } else if (event.type === 'pointerleave') {
            if (this.parentMenu.rootMenu.activeMenu === this.parentMenu) {
                this.parentMenu.activeMenuItem = null;
            }
        } else if (event.type === 'pointerup') {
            // when modal, the items are activated on click,
            // so ignore mouseup
            if (this.parentMenu.rootMenu.state !== 'modal') {
                this.select(keyboardModifiersFromEvent(event));
            }
            event.stopPropagation();
            event.preventDefault();
        }
    }

    abstract get type():
        | 'normal'
        | 'divider'
        | 'submenu'
        | 'checkbox'
        | 'radio';

    abstract get active(): boolean;
    abstract get hidden(): boolean;
    abstract get disabled(): boolean;
    abstract get label(): string;
    abstract set active(val: boolean);

    // Notify the owner that a menu item has been selected
    abstract dispatchSelect(kbd?: KeyboardModifiers): void;

    abstract get element(): HTMLElement;

    /**
     * Called when a menu item is selected:
     * - either dismiss the menu and execute the command
     * - or display the submenu
     */
    select(kbd?: KeyboardModifiers): void {
        this.parentMenu.rootMenu.cancelDelayedOperation();

        if (this.submenu) {
            this.openSubmenu(kbd);
            return;
        }

        // Make the item blink, then execute the command
        this.active = false;
        setTimeout(() => {
            this.active = true;
            setTimeout(() => {
                this.active = false;
                setTimeout(() => {
                    this.parentMenu.rootMenu.hide();
                    setTimeout(() => this.dispatchSelect(kbd), 120);
                }, 120);
            }, 120);
        }, 120);
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
        const bounds = this.element.getBoundingClientRect();
        this.submenu.show({
            location: [bounds.right, bounds.top - 4],
            alternateLocation: [bounds.left, bounds.top - 4],
            parent: this.parentMenu.rootMenu.element.parentNode,
            keyboardModifiers: kbd,
        });
    }

    movingTowardSubmenu(ev: PointerEvent): boolean {
        const lastEv = this.parentMenu.rootMenu.lastMoveEvent;
        if (!lastEv) return false;

        const deltaT = ev.timeStamp - lastEv.timeStamp;
        if (deltaT > 500) return false;

        const deltaX = ev.clientX - lastEv.clientX;

        // Moving too slow?
        const s = speed(deltaX, lastEv.clientY - ev.clientY, deltaT);
        if (s <= 0.2) return false;

        // Moving horizontally towards the submenu?
        let position: 'left' | 'right' = 'right';
        if (this.submenu.element) {
            const submenuBounds = this.submenu.element.getBoundingClientRect();

            const bounds = this.element.getBoundingClientRect();
            if (submenuBounds.left < bounds.left + bounds.width / 2) {
                position = 'left';
            }
        }

        return position === 'right' ? deltaX > 0 : deltaX < 0;
    }
}

function speed(dx: number, dy: number, dt: number): number {
    return Math.sqrt(dx * dx + dy * dy) / dt;
}

export interface MenuInterface {
    parentMenu: MenuInterface;
    readonly rootMenu: RootMenuInterface;
    // readonly menuHost: Element;

    readonly element: HTMLElement;
    readonly isSubmenuOpen: boolean;

    activeMenuItem: MenuItem;
    readonly firstMenuItem: MenuItem;
    readonly lastMenuItem: MenuItem;

    openSubmenu: MenuInterface;
    readonly hasRadio: boolean;
    readonly hasCheckbox: boolean;

    hide(): void;
    show(options: {
        parent: Node;
        location?: [x: number, y: number];
        alternateLocation?: [x: number, y: number];
        keyboardModifiers?: KeyboardModifiers;
    }): void;
    nextMenuItem(dir: number): MenuItem;
    findMenuItem(text: string): MenuItem;
    dispatchEvent(ev: Event): boolean;
}

export interface RootMenuInterface extends MenuInterface {
    lastMoveEvent: PointerEvent;
    activeMenu: MenuInterface;
    state: 'closed' | 'open' | 'modal';
    readonly scrim: Element;

    cancelDelayedOperation(): void;
    scheduleOperation(op: () => void): void;
}
