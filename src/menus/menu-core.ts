import {
  KeyboardModifiers,
  keyboardModifiersFromEvent,
} from '../common/events';
import { fitInViewport } from '../common/scrim';
import { addPart, removePart, UIElement } from '../common/ui-element';
import { MenuInterface, MenuItem, RootMenuInterface } from './menu-base';
import { UIMenuItem } from './menu-item-element';
import { UISubmenu } from './submenu-element';

export type MenuItemTemplate = {
  onSelect?: (ev: CustomEvent<MenuSelectEvent>) => void;
  type?: 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio';
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
  submenu?: MenuItemTemplate[];

  hidden?:
    | boolean
    | ((
        item: MenuItemTemplate,
        keyboardModifiers?: KeyboardModifiers
      ) => boolean);
  disabled?:
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

  /** Caller defined id string. Passed to the `onSelect()` hook. */
  id?: string;

  /** Caller defined data block. Passed to the `onSelect()` hook. */
  data?: any;
};

/**
 * An instance of `Menu` is a model of a collection of menu items, including
 * submenus.
 *
 *
 */
export class Menu implements MenuInterface {
  parentMenu: MenuInterface | null;
  isSubmenuOpen: boolean; // If true, _activeMenuItem.submenu_ is open

  /**
   * The Element from which menu items will be used as template (optional)
   */
  menuHost?: Element;

  hasCheckbox = false; // If true, has at least one checkbox menu item
  hasRadio = false; // If true, has at least one radio menu item

  protected _element: HTMLElement | null = null;
  protected _menuItems: MenuItem[] = [];
  private _activeMenuItem: MenuItem | null = null;

  /*
   * The menu items template are preserved so that the actual menu items
   * can be recalculated, for example if the keyboard modifiers change.
   * (when isDynamic is true)
   */
  private _menuItemsTemplate: MenuItemTemplate[] | undefined;

  /**
   * Optional, an HTML element to be used as the container for this menu.
   * Used when this maps to a custom element with a <ul> in its template.
   */
  protected _assignedContainer?: HTMLElement | null;

  /**
   * - host: if the menu is inside an element, the host is this element.
   * This is where a set of <ui-menu-item> elements will be read from.
   * - assignedContainer: the element into which the menu items will be
   * inserted. A <ul>. Could be in a custom element. If none is provided,
   * a new <ul> is created.
   * - wrapper: an element that wraps the container. This elements
   * gets attached to the scrim for display. If none is provided,
   * the container is used directly. Pass the custom element when
   * a custom element wrapper is used (e.g. for <ui-submenu>)
   */
  constructor(
    menuItems?: MenuItemTemplate[],
    options?: {
      parentMenu?: MenuInterface;
      host?: Element;
      assignedContainer?: HTMLElement | null;
    }
  ) {
    this.parentMenu = options?.parentMenu ?? null;
    this._assignedContainer = options?.assignedContainer;

    this._menuItemsTemplate = menuItems;
    this.isSubmenuOpen = false;

    this.menuHost = options?.host;
  }

  handleEvent(event: Event): void {
    if (event.type === 'wheel' && this._element) {
      const ev = event as WheelEvent;
      // Scroll wheel: adjust scroll position
      this._element.scrollBy(0, ev.deltaY);

      event.preventDefault();
      event.stopPropagation();
    }
  }

  get rootMenu(): RootMenuInterface {
    return this.parentMenu!.rootMenu;
  }

  dispatchEvent(ev: Event): boolean {
    return this.rootMenu.dispatchEvent(ev);
  }

  /**
   * Update the 'model' of this menu (i.e. list of menu items) based
   * on:
   * - the state of the keyboard, for programmatically specified items
   * - the content of the JSON and elements inside the host element
   * (if there is one)
   */
  updateMenu(keyboardModifiers?: KeyboardModifiers): void {
    // Save the current menu
    const element = this._element;
    let saveCurrentItem = -1;
    let left = 0;
    let top = 0;
    let parent: Node | undefined | null;
    if (element) {
      // If there is a cached element for this menu,
      // remove it (but save its state)
      saveCurrentItem = this.activeMenuItem
        ? this._menuItems!.indexOf(this.activeMenuItem)
        : -1;
      parent = element.parentNode;
      left = Number.parseInt(element.style.left);
      top = Number.parseInt(element.style.top);
      parent?.removeChild(element);
      this._element = null;
    }

    this._menuItems = [];
    this.hasCheckbox = false;
    this.hasRadio = false;
    if (this._menuItemsTemplate) {
      for (const x of this._menuItemsTemplate) {
        this.appendMenuItem(x, keyboardModifiers);
      }
    }

    // Add menu-item-elements
    if (this.menuHost?.shadowRoot) {
      const slot = this.menuHost.shadowRoot.querySelector<HTMLSlotElement>(
        'slot'
      );
      if (slot) {
        const itemElements = slot
          .assignedElements()
          .filter<UIMenuItem>(
            (x): x is UIMenuItem => x.tagName === 'UI-MENU-ITEM'
          );
        for (const el of itemElements) {
          this.appendMenuItem(el, keyboardModifiers);
        }
      }
    }

    this.hasCheckbox = this._menuItems.some((x) => x.type === 'checkbox');
    this.hasRadio = this._menuItems.some((x) => x.type === 'radio');

    if (element) {
      // If there was a previous version of the menu,
      // restore it and its state
      parent?.appendChild(this.element);

      fitInViewport(this.element, {
        location: [left, top],
        verticalPos: 'bottom',
        horizontalPos: 'right',
      });

      this.activeMenuItem =
        saveCurrentItem >= 0 ? this.menuItems[saveCurrentItem] : null;
      if (this.activeMenuItem?.submenu) {
        this.activeMenuItem.openSubmenu(keyboardModifiers);
      }
    }
  }

  get menuItems(): MenuItem[] {
    return this._menuItems;
  }

  set menuItemTemplates(value: MenuItemTemplate[]) {
    this._menuItemsTemplate = value;
    if (this._element) {
      if (this.menuItems.filter((x) => !x.hidden).length === 0) {
        this.hide();
        return;
      }

      this.updateMenu();
    }
  }

  /** First activable menu item */
  get firstMenuItem(): MenuItem | null {
    let result = 0;
    let found = false;
    const { menuItems } = this;
    while (!found && result <= menuItems.length - 1) {
      const item = menuItems[result];
      found = item.type !== 'divider' && !item.hidden && !item.disabled;
      result += 1;
    }

    return found ? menuItems[result - 1] : null;
  }

  /** Last activable menu item */
  get lastMenuItem(): MenuItem | null {
    let result = this.menuItems.length - 1;
    let found = false;
    while (!found && result >= 0) {
      const item = this.menuItems[result];
      found = item.type !== 'divider' && !item.hidden && !item.disabled;
      result -= 1;
    }

    return found ? this.menuItems[result + 1] : null;
  }

  /**
   * The active menu is displayed on a colored background.
   */
  get activeMenuItem(): MenuItem | null {
    return this._activeMenuItem;
  }

  /**
   * Set to undefined to have no active item.
   * Note that setting the active menu item doesn't automatically
   * open the submenu (e.g. when keyboard navigating).
   * Call `item.submenu.openSubmenu()` to open the submenu.
   */
  set activeMenuItem(value: MenuItem | null) {
    this.parentMenu?.rootMenu.cancelDelayedOperation();
    if (value !== this._activeMenuItem) {
      // Remove previously active element
      if (this.activeMenuItem) {
        const item = this.activeMenuItem;
        item.active = false;
        // If there is a submenu, hide it
        item.submenu?.hide();
      }

      if (value?.hidden) {
        this._activeMenuItem = null;
        return;
      }

      this._activeMenuItem = value;

      // Make new element active
      if (value) value.active = true;
    }

    if (value) {
      value.element?.focus();
    } else {
      this._element?.focus();
    }

    // Update secondary state of parent
    this.parentMenu?.activeMenuItem?.element?.classList.toggle(
      'is-submenu-open',
      Boolean(value)
    );
  }

  nextMenuItem(dir: number): MenuItem | null {
    if (!this._activeMenuItem && dir > 0) return this.firstMenuItem;
    if (!this._activeMenuItem && dir < 0) return this.lastMenuItem;
    if (!this.firstMenuItem || !this.lastMenuItem || !this._activeMenuItem) {
      return null;
    }
    const first = this._menuItems.indexOf(this.firstMenuItem);
    const last = this._menuItems.indexOf(this.lastMenuItem);
    let found = false;
    let result = this._menuItems.indexOf(this._activeMenuItem) + dir;
    while (!found && result >= first && result <= last) {
      const item = this._menuItems[result];
      found = item.type !== 'divider' && !item.hidden && !item.disabled;
      result += dir;
    }

    return found
      ? this._menuItems[result - dir]
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

  findMenuItem(text: string): MenuItem | null {
    const candidates = this._menuItems.filter(
      (x) => x.type !== 'divider' && !x.hidden && !x.disabled
    );
    if (candidates.length === 0) return null;
    const last =
      Math.max(...candidates.map((x) => x.label.length)) - text.length;

    if (last < 0) return null;

    // Find a "contain" match
    let result: MenuItem | null = null;
    let i = 0;
    while (i < last && !result) {
      result =
        candidates.find(
          (x) =>
            Menu.collator.compare(text, x.label.substr(i, text.length)) === 0
        ) ?? null;
      i++;
    }

    return result;
  }

  makeElement(container?: HTMLElement | null): HTMLElement {
    const ul = container ?? document.createElement('ul');
    ul.classList.add('menu-container');
    ul.setAttribute('part', 'menu-container');
    ul.setAttribute('tabindex', '-1');
    ul.setAttribute('role', 'menu');
    ul.setAttribute('aria-orientation', 'vertical');
    ul.addEventListener('wheel', this);

    // Remove all items
    ul.textContent = '';

    // Add back all necessary items (after they've been updated if applicable)
    for (const { element } of this._menuItems) {
      if (element) ul.append(element);
    }
    ul.querySelector('li:first-of-type')?.setAttribute('tabindex', '0');

    return ul;
  }

  /**
   * Construct (or return a cached version) of an element representing
   * the items in this menu (model -> view)
   */
  get element(): HTMLElement {
    if (!this._element) {
      this._element = this.makeElement(this._assignedContainer);
    }

    return this._element;
  }

  /**
   * @param parent: where the menu should be attached
   * @return false if no menu to show
   */
  show(options: {
    parent: Node;
    location?: [x: number, y: number];
    alternateLocation?: [x: number, y: number];
    keyboardModifiers?: KeyboardModifiers;
  }): boolean {
    this.updateMenu(options?.keyboardModifiers);
    if (this.menuItems.filter((x) => !x.hidden).length === 0) return false;

    options.parent.appendChild(this.element);

    if (options.location) {
      fitInViewport(this.element, {
        location: options.location,
        alternateLocation: options.alternateLocation,
        verticalPos: 'bottom',
        horizontalPos: 'right',
      });
    }

    this.element.focus();

    // Notify our parent we have opened
    // (so the parent can close any other open submenu and/or
    // change its state to display the active state correctly)
    if (this.parentMenu) {
      this.parentMenu.openSubmenu = this;
    }

    return true;
  }

  hide(): void {
    // Hide any of our child submenus
    this.openSubmenu = null;

    this.activeMenuItem = null;

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
  set openSubmenu(submenu: MenuInterface | null) {
    const expanded = submenu !== null;
    // We're closing a submenu
    if (this.activeMenuItem?.submenu) {
      this.activeMenuItem.element?.setAttribute(
        'aria-expanded',
        expanded.toString()
      );
    }

    this.isSubmenuOpen = expanded;
  }

  appendMenuItem(
    menuItem: MenuItemTemplate | UIMenuItem,
    keyboardModifiers?: KeyboardModifiers
  ): void {
    this.insertMenuItem(-1, menuItem, keyboardModifiers);
  }

  insertMenuItem(
    pos: number,
    menuItem: MenuItemTemplate | UIMenuItem,
    keyboardModifiers?: KeyboardModifiers
  ): void {
    if (pos < 0) pos = Math.max(0, this._menuItems.length - 1);

    const item =
      menuItem instanceof UIMenuItem
        ? new MenuItemFromElement(menuItem, this)
        : new MenuItemFromTemplate(menuItem, this, {
            keyboardModifiers,
          });

    this._menuItems.splice(pos + 1, 0, item);
  }
}

export function evalToBoolean(
  item: MenuItemTemplate,
  value:
    | boolean
    | undefined
    | ((
        item: MenuItemTemplate,
        keyboardModifiers?: KeyboardModifiers
      ) => boolean),
  keyboardModifiers?: KeyboardModifiers
): boolean | undefined {
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
    | undefined
    | ((
        item: MenuItemTemplate,
        keyboardModifiers?: KeyboardModifiers
      ) => string),
  options?: {
    keyboardModifiers?: KeyboardModifiers;
  }
): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'function') {
    return value(item, options?.keyboardModifiers);
  }

  return undefined;
}

const CHEVRON_RIGHT_TEMPLATE = document.createElement('template');
CHEVRON_RIGHT_TEMPLATE.innerHTML = `<span aria-hidden="true" class="right-chevron"><svg focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg></span>`;

const CHECKMARK_TEMPLATE = document.createElement('template');
CHECKMARK_TEMPLATE.innerHTML = `<span aria-hidden="true" class="checkmark"><svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M435.848 83.466L172.804 346.51l-96.652-96.652c-4.686-4.686-12.284-4.686-16.971 0l-28.284 28.284c-4.686 4.686-4.686 12.284 0 16.971l133.421 133.421c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-28.284-28.284c-4.686-4.686-12.284-4.686-16.97 0z"></path></svg>
</span>`;

export type MenuSelectEvent = {
  keyboardModifiers?: KeyboardModifiers;
  id?: string;
  label?: string;
  data?: any;
  element?: HTMLElement;
};

declare global {
  /**
   * Map the custom event names to types
   * @internal
   */
  export interface DocumentEventMap {
    ['select']: CustomEvent<MenuSelectEvent>;
  }
}

export class MenuItemFromTemplate extends MenuItem {
  _type: 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio';
  _label?: string;
  _disabled: boolean;
  _hidden: boolean;

  ariaLabel?: string;
  ariaDetails?: string;
  checked?: boolean;
  onSelect?: (ev: CustomEvent<MenuSelectEvent>) => void;
  submenu?: MenuInterface;
  id?: string;
  data?: any;

  _element: HTMLElement | null = null;

  constructor(
    template: MenuItemTemplate,
    parentMenu: MenuInterface,
    options?: {
      keyboardModifiers?: KeyboardModifiers;
    }
  ) {
    super(parentMenu);
    this.parentMenu = parentMenu;

    this._hidden =
      evalToBoolean(template, template.hidden, options?.keyboardModifiers) ??
      false;
    this._disabled =
      evalToBoolean(template, template.disabled, options?.keyboardModifiers) ??
      false;
    this.checked =
      evalToBoolean(template, template.checked, options?.keyboardModifiers) ??
      false;

    this.id = template.id;
    this._label = evalToString(template, template.label, options);
    this.ariaLabel = evalToString(template, template.ariaLabel, options);
    this.ariaDetails = evalToString(template, template.ariaDetails, options);
    if (typeof template.onSelect) {
      this.onSelect = template.onSelect;
    }

    this.data = template.data;

    if (Array.isArray(template.submenu)) {
      this._type = 'submenu';
      this.submenu = new Menu(template.submenu, {
        parentMenu,
      });
    } else if (template.type === undefined && template.checked !== undefined) {
      this._type = 'checkbox';
    } else {
      this._type = template.type ?? 'normal';
    }
  }

  get type(): 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio' {
    return this._type;
  }

  get label(): string {
    return this._label ?? this.ariaLabel ?? '';
  }

  get hidden(): boolean {
    return this._hidden;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  private render(): HTMLElement | null {
    if (this.hidden) return null;

    if (this.type === 'divider') {
      const li = document.createElement('li');
      li.setAttribute('part', 'menu-divider');
      li.setAttribute('role', 'divider');
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
    li.setAttribute('part', 'menu-item');
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
      li.append(CHECKMARK_TEMPLATE.content.cloneNode(true));
    }

    if (this.submenu) {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');
    }

    if (this.ariaLabel) li.setAttribute('aria-label', this.ariaLabel);
    if (this.ariaDetails) li.setAttribute('aria-label', this.ariaDetails);

    if (this.disabled) {
      li.setAttribute('aria-disabled', 'true');
    } else {
      li.removeAttribute('aria-disabled');
      li.addEventListener('pointerenter', this);
      li.addEventListener('pointerleave', this);
      li.addEventListener('pointerup', this);
    }

    const span = document.createElement('span');
    span.innerHTML = this.label;
    span.className =
      this.parentMenu.hasCheckbox || this.parentMenu.hasRadio
        ? 'label indent'
        : 'label';
    if (!this.disabled) {
      span.addEventListener('click', (ev: MouseEvent) => {
        this.select(keyboardModifiersFromEvent(ev));
      });
    }

    li.append(span);
    if (this.submenu) {
      li.append(CHEVRON_RIGHT_TEMPLATE.content.cloneNode(true));
    }

    return li;
  }

  get active(): boolean {
    return this.element?.classList.contains('active') ?? false;
  }

  set active(value: boolean) {
    if (!this.element) return;
    if (value) {
      this.element.classList.add('active');
    } else {
      this.element.classList.remove('active');
    }
  }

  get element(): HTMLElement | null {
    if (this._element) return this._element;
    this._element = this.render();
    return this._element;
  }

  dispatchSelect(kbd?: KeyboardModifiers): void {
    const ev = new CustomEvent<MenuSelectEvent>('select', {
      detail: {
        keyboardModifiers: kbd,
        id: this.id,
        label: this.label,
        data: this.data,
      },
    });
    if (typeof this.onSelect === 'function') {
      this.onSelect(ev);
    } else {
      this.parentMenu.dispatchEvent(ev);
    }
  }
}

export class MenuItemFromElement extends MenuItem {
  // The <ui-menu-item> in the <slot> serves as the 'template' for this
  // menu item
  _sourceElement: UIElement;
  // The source element is cloned and inserted in a <li>
  _sourceElementClone?: UIElement;
  // The <li> is cached
  _cachedElement: HTMLElement | null = null;

  constructor(element: UIMenuItem, parentMenu: MenuInterface) {
    super(parentMenu);
    this.parentMenu = parentMenu;
    this._sourceElement = element;
    element.menuItem = this;

    // Read a <ui-submenu> element if there is one
    if (element.shadowRoot) {
      const submenuElements = element.shadowRoot
        .querySelector<HTMLSlotElement>('slot')
        ?.assignedElements()
        .filter<UISubmenu>((x): x is UISubmenu => x.tagName === 'UI-SUBMENU');
      console.assert(
        submenuElements && submenuElements.length <= 1,
        'Expected no more than one submenu'
      );
      if (submenuElements && submenuElements.length > 0) {
        this.submenu = new Submenu({
          host: submenuElements[0],
          parentMenu,
        });
      }
    }
  }

  get type(): 'normal' | 'divider' | 'submenu' | 'checkbox' | 'radio' {
    if (this.divider) return 'divider';
    if (this.submenu) return 'submenu';
    // @todo:  radio, checkbox
    return 'normal';
  }

  get label(): string {
    return this._sourceElement.innerHTML;
  }

  get hidden(): boolean {
    return this._sourceElement.hasAttribute('hidden');
  }

  set hidden(value: boolean) {
    if (value) {
      this._sourceElementClone?.setAttribute('hidden', '');
    } else {
      this._sourceElementClone?.removeAttribute('hidden');
    }
  }

  get disabled(): boolean {
    return this._sourceElement.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    if (!this._cachedElement) return;
    if (value) {
      this._sourceElementClone?.setAttribute('disabled', '');
      addPart(this._cachedElement, 'disabled');
    } else {
      this._sourceElementClone?.removeAttribute('disabled');
      removePart(this._cachedElement, 'disabled');
    }
  }

  get checked(): boolean {
    return this._sourceElement.hasAttribute('checked');
  }

  set checked(value: boolean) {
    if (!this._cachedElement) return;
    if (value) {
      this._sourceElementClone?.setAttribute('checked', '');
      addPart(this._cachedElement, 'checked');
    } else {
      this._sourceElementClone?.removeAttribute('checked');
      removePart(this._cachedElement, 'checked');
    }
  }

  get divider(): boolean {
    return this._sourceElement.hasAttribute('divider');
  }

  set divider(value: boolean) {
    if (value) {
      this._sourceElementClone?.setAttribute('divider', '');
    } else {
      this._sourceElementClone?.removeAttribute('divider');
    }
  }

  get active(): boolean {
    return this._cachedElement?.classList.contains('active') ?? false;
  }

  set active(value: boolean) {
    if (!this._cachedElement) return;
    // For the active attribute, set the value on the sourced element
    // (the <ui-menu-item>)
    if (value) {
      this._cachedElement?.classList.add('active');
      addPart(this._cachedElement, 'active');
      this._sourceElementClone?.setAttribute('active', '');
    } else {
      this._cachedElement?.classList.remove('active');
      removePart(this._cachedElement, 'active');
      this._sourceElementClone?.removeAttribute('active');
    }
  }

  private render(): HTMLElement | null {
    if (this.hidden) return null;

    if (this.divider) {
      const li = document.createElement('li');
      li.setAttribute('part', 'menu-divider');
      li.setAttribute('role', 'divider');
      return li;
    }

    const li = document.createElement('li');
    li.setAttribute('part', 'menu-item');
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
      li.append(CHECKMARK_TEMPLATE.content.cloneNode(true));
    }

    if (this.submenu) {
      li.setAttribute('aria-haspopup', 'true');
      li.setAttribute('aria-expanded', 'false');
    }

    if (this.disabled) {
      li.setAttribute('aria-disabled', 'true');
    } else {
      li.removeAttribute('aria-disabled');
      li.addEventListener('pointerenter', this);
      li.addEventListener('pointerleave', this);
      li.addEventListener('pointerup', this);
    }

    if (!this.disabled) {
      li.addEventListener('click', (ev: MouseEvent) => {
        this.select(keyboardModifiersFromEvent(ev));
      });
    }

    this._sourceElementClone = this._sourceElement.cloneNode(true) as UIElement;
    li.append(this._sourceElementClone);
    if (this.submenu) {
      li.append(CHEVRON_RIGHT_TEMPLATE.content.cloneNode(true));
    }

    return li;
  }

  get element(): HTMLElement | null {
    if (this._cachedElement) return this._cachedElement;
    this._cachedElement = this.render();
    return this._cachedElement;
  }

  dispatchSelect(kbd?: KeyboardModifiers): void {
    const ev = new CustomEvent<MenuSelectEvent>('select', {
      detail: {
        keyboardModifiers: kbd,
        id: this._sourceElement.getAttribute('id') ?? '',
        label: this.label,
        element: this._sourceElement,
      },
    });
    if (typeof this._sourceElement.onselect === 'function') {
      this._sourceElement.onselect(ev);
    } else {
      this.parentMenu.dispatchEvent(ev);
    }
  }
}

export class Submenu extends Menu {
  source: UISubmenu;
  constructor(options: { host: UISubmenu; parentMenu: MenuInterface }) {
    super([], {
      parentMenu: options.parentMenu,
      host: options.host,
    });
    this.source = options.host;
  }

  get element(): HTMLElement {
    if (this._element) return this._element;

    const clone = this.source.cloneNode(true) as UISubmenu;
    // Clone.style.display = 'block';
    clone.importStyle();
    this.makeElement(clone.shadowRoot?.querySelector('ul'));
    this._element = clone;
    return clone;
  }

  show(options?: {
    location?: [x: number, y: number];
    keyboardModifiers?: KeyboardModifiers;
  }): boolean {
    if (!this.parentMenu?.rootMenu) return false;
    return super.show({
      ...options,
      parent: this.parentMenu.rootMenu.scrim,
    });
  }

  /**
   */
  hide(): void {
    super.hide();
  }
}
