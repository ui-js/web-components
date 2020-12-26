import { getEdge, getOppositeEdge, UIElement } from '../common/ui-element';
import {
  keyboardModifiersFromEvent,
  KeyboardModifiers,
} from '../common/events';
import { MenuItemTemplate } from './menu-core';
import { RootMenu } from './root-menu';
import { MENU_TEMPLATE, MENU_STYLE } from './menu-templates';

export class UIPopupMenu extends UIElement {
  private rootMenu: RootMenu;
  private templateMenuItems: MenuItemTemplate[];
  position: 'leading' | 'trailing' | 'left' | 'end';

  private _savedTransform: string;

  constructor(menuItems?: MenuItemTemplate[]) {
    super({
      template: MENU_TEMPLATE,
      style: MENU_STYLE,
    });
    this.templateMenuItems = menuItems ?? [];
    this.reflectStringAttribute('position');
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
    if (event.type === 'keydown' && event.target === this.parentElement) {
      const evt = event as KeyboardEvent;
      if (evt.code === 'Return' || evt.code === 'Enter') {
        this.show({
          keyboardModifiers: keyboardModifiersFromEvent(evt),
        });
        event.preventDefault();
        event.stopPropagation();
      }
    } else if (event.type === 'pointerdown') {
      console.assert(this.shadowRoot.host.parentNode === this.parentElement);
      if (event.target === this.shadowRoot.host.parentNode) {
        this.show({
          keyboardModifiers: keyboardModifiersFromEvent(event),
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
  show(options?: { keyboardModifiers?: KeyboardModifiers }): void {
    if (!this.parentElement) return;
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
          assignedElement: this.shadowRoot.querySelector<HTMLElement>('ul'),
        }
      );
    }
    this.style.display = 'inline-block';
    // This is yucky...
    // The 'fixed' display mode (used by the scrim to position itself over
    // the viewport) becomes 'relative' when a transform is specified
    // on a parent element in WebKit and Chromium.
    // See https://stackoverflow.com/revisions/15256339/2
    // So we have to remove any transform that might be present to prevent
    // the scrim from being displayed incorrectly.
    this._savedTransform = window.getComputedStyle(
      this.parentElement
    ).transform;
    if (this._savedTransform !== 'none') {
      this.parentElement.style.transform = 'none';
    }
    const bounds = this.parentElement.getBoundingClientRect();
    if (
      this.rootMenu.show({
        ...options,
        location: [
          getEdge(bounds, this.position ?? 'leading', this.computedDir),
          bounds.bottom,
        ],
        alternateLocation: [
          getOppositeEdge(bounds, this.position ?? 'leading', this.computedDir),
          bounds.bottom,
        ],
        parent: this.shadowRoot,
      })
    ) {
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
    if (this._savedTransform !== 'none') {
      this.parentElement.style.transform = this._savedTransform;
    }
  }
}

export default UIPopupMenu;

declare global {
  /** @internal */
  export interface Window {
    UIPopupMenu: typeof UIPopupMenu;
  }
}

if (!window.customElements.get('ui-popup-menu')) {
  window.UIPopupMenu = UIPopupMenu;
  window.customElements.define('ui-popup-menu', UIPopupMenu);
}
