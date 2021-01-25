import {
  equalKeyboardModifiers,
  KeyboardModifiers,
  keyboardModifiersFromEvent,
  mightProducePrintableCharacter,
} from '../common/events';
import { Scrim } from '../common/scrim';
import { Menu, MenuItemTemplate } from './menu-core';
import { MenuInterface, RootMenuInterface } from './menu-base';

export class RootMenu extends Menu implements RootMenuInterface {
  lastMoveEvent?: PointerEvent;

  private typingBufferResetTimer = 0;
  private typingBuffer: string;
  private readonly _scrim: Scrim;
  private _openTimestamp?: number;
  private currentKeyboardModifiers?: KeyboardModifiers;
  private hysteresisTimer = 0;
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
   * If an `options.assignedElement` is provided, the root menu is
   * attached to that element (the element will be modified
   * to display the menu). Use this when using a popup menu.
   * In this mode, call `show()` and `hide()` to control the
   * display of the menu.
   *
   */
  constructor(
    menuItems: MenuItemTemplate[],
    options?: {
      host?: Element;
      assignedElement?: HTMLElement | null;
      keyboardModifiers?: KeyboardModifiers;
    }
  ) {
    super(menuItems, {
      host: options?.host,
      assignedContainer: options?.assignedElement ?? null,
    });
    this.isDynamic = menuItems.some(isDynamic);
    this.currentKeyboardModifiers = options?.keyboardModifiers;
    this.typingBuffer = '';
    this.state = 'closed';

    this._scrim = new Scrim({
      onClose: () => {
        this.hide();
      },
    });
  }

  /**
   * The currently active menu: could be the root menu or a submenu
   */
  get activeMenu(): MenuInterface {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: MenuInterface = this;
    while (result.isSubmenuOpen) {
      result = result.activeMenuItem!.submenu!;
    }

    return result;
  }

  handleKeyupEvent(ev: KeyboardEvent): void {
    if (this.isDynamic) {
      const newModifiers = keyboardModifiersFromEvent(ev);
      if (
        !equalKeyboardModifiers(this.currentKeyboardModifiers, newModifiers)
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
        !equalKeyboardModifiers(this.currentKeyboardModifiers, newModifiers)
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
          const activeMenu = menu.parentMenu!.activeMenuItem;
          if (activeMenu) {
            const { element } = activeMenu;
            element?.focus();
            element?.classList.remove('is-submenu-open');
          }
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
        Number.isFinite(this.rootMenu._openTimestamp!) &&
        Date.now() - this.rootMenu._openTimestamp! < 120
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
      return;
    }

    super.handleEvent(event);
  }

  dispatchEvent(ev: Event): boolean {
    if (!this.menuHost) return false;
    return this.menuHost.dispatchEvent(ev);
  }

  get scrim(): Element {
    return this._scrim.element;
  }

  private connectScrim(root?: Node | null): void {
    const { scrim } = this;
    scrim.addEventListener('pointerup', this);

    scrim.addEventListener('contextmenu', this);

    scrim.addEventListener('keydown', this);
    scrim.addEventListener('keyup', this);
    scrim.addEventListener('pointermove', this);

    this._scrim.open({ root });
  }

  private disconnectScrim(): void {
    const { scrim } = this;
    scrim.removeEventListener('pointerup', this);

    scrim.removeEventListener('contextmenu', this);

    scrim.removeEventListener('keydown', this);
    scrim.removeEventListener('keyup', this);
    scrim.removeEventListener('pointermove', this);
    this._scrim.close();
  }

  get rootMenu(): RootMenu {
    // I AM THE ONE WHO KNOCKS
    return this;
  }

  show(options?: {
    location?: [x: number, y: number];
    alternateLocation?: [x: number, y: number];
    parent?: Node | null; // Where the menu should attach
    keyboardModifiers?: KeyboardModifiers;
  }): boolean {
    // Connect the scrim now, so that the menu can be measured and placed
    this.connectScrim(options?.parent);
    if (!super.show({ ...options, parent: this.scrim })) {
      // There was nothing to show: remove the scrim
      this.disconnectScrim();
      return false;
    }

    // Record the opening time.
    // If we receive a mouseup within a small delta of the open time stamp
    // hold the menu open until it is dismissed, otherwise close it.
    this._openTimestamp = Date.now();
    this.state = 'open';
    return true;
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
      this.hysteresisTimer = 0;
      fn();
    }, delay);
  }

  cancelDelayedOperation(): void {
    if (this.hysteresisTimer) {
      clearTimeout(this.hysteresisTimer);
      this.hysteresisTimer = 0;
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
