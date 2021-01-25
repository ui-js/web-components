import { UIElement } from './common/ui-element';

export { UIContextMenu, UIPopupMenu, UISubmenu } from './menus/menus';

/**
 * To insure that all the web components are ready to use, and in particular
 * that custom methods on web components can be called, use:
 * ```
 * try {
 *  await ready();
 * // Ready to use the web components...
 * } catch (e) {
 *  // web components are not supported
 * }
 * ```
 *
 */
export async function ready(): Promise<unknown> {
  if (window?.customElements) {
    return Promise.all<void>(
      Object.keys(UIElement.registry).map((x) =>
        window.customElements.whenDefined(x)
      )
    );
  }

  return Promise.reject<void>(new Error('web components not supported'));
}
