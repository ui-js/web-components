import { getComputedDir } from './ui-element';

export class Scrim {
  private _element: HTMLElement;

  private preventOverlayClose: boolean;
  private onClose: () => void;

  private savedOverflow: string;
  private savedMarginRight: string;

  private savedActiveElement: HTMLOrSVGElement;

  private state: 'closed' | 'opening' | 'open' | 'closing';

  private translucent: boolean;

  /**
   * - If `options.preventOverlayClose` is false, the scrim is closed if the
   * user clicks on the scrim. That's the behavior for menus, for example.
   * When you need a fully modal situation until the user has made an
   * explicit choice (validating cookie usage, for example), set
   * `preventOverlayClose` to true.
   * - `onClose()` is called when the scrim is being closed
   * -
   */
  constructor(options?: {
    translucent?: boolean;
    preventOverlayClose?: boolean;
    onClose?: () => void;
  }) {
    this.preventOverlayClose = options?.preventOverlayClose ?? false;
    this.translucent = options?.translucent ?? false;

    this.state = 'closed';
  }

  get element(): HTMLElement {
    if (this._element) return this._element;

    const el = document.createElement('div');
    el.setAttribute('role', 'presentation');

    el.style.position = 'fixed';
    el.style['contain'] = 'content';
    el.style.top = '0';
    el.style.left = '0';
    el.style.right = '0';
    el.style.bottom = '0';
    el.style.zIndex = '9999';
    el.style.outline = 'none';
    if (this.translucent) {
      el.style.background = 'rgba(255, 255, 255, .2)';
      el.style['backdropFilter'] = 'contrast(40%)';
    } else {
      el.style.background = 'transparent';
    }
    this._element = el;
    return el;
  }

  open(options: { root?: Node; child?: HTMLElement }): void {
    if (this.state !== 'closed') return;

    this.state = 'opening';

    // Remember the previously focused element. We'll restore it when we close.
    this.savedActiveElement = deepActiveElement();

    const el = this.element;
    (options?.root ?? document.body).appendChild(el);

    el.addEventListener('click', this);
    document.addEventListener('touchmove', this, false);
    document.addEventListener('scroll', this, false);

    // Prevent (some) scrolling
    // (touch scrolling will still happen)
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    this.savedMarginRight = document.body.style.marginRight;
    this.savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const marginRight = parseFloat(getComputedStyle(document.body).marginRight);

    document.body.style.marginRight = `${marginRight + scrollbarWidth}px`;

    if (options?.child) {
      el.appendChild(options.child);
    }
    this.state = 'open';
  }

  close(): void {
    if (this.state !== 'open') return;
    this.state = 'closing';

    if (typeof this.onClose === 'function') this.onClose();

    const el = this.element;
    el.removeEventListener('click', this);
    document.removeEventListener('touchmove', this, false);
    document.removeEventListener('scroll', this, false);

    el.parentNode.removeChild(el);

    // Restore body state
    document.body.style.overflow = this.savedOverflow;
    document.body.style.marginRight = this.savedMarginRight;

    // Restore the previously focused element
    this.savedActiveElement?.focus?.();

    // Remove all children
    el.innerHTML = '';
    this.state = 'closed';
  }

  handleEvent(ev: Event): void {
    if (!this.preventOverlayClose) {
      if (ev.target === this._element && ev.type === 'click') {
        this.close();
        ev.preventDefault();
        ev.stopPropagation();
        return;
      } else if (
        ev.target === document &&
        (ev.type === 'touchmove' || ev.type === 'scroll')
      ) {
        // This is an attempt at scrolling on a touch-device
        this.close();
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
    }
  }
}

function deepActiveElement(): HTMLOrSVGElement | null {
  let a = document.activeElement;
  while (a?.shadowRoot?.activeElement) {
    a = a.shadowRoot.activeElement;
  }
  return (a as unknown) as HTMLOrSVGElement;
}

/**
 * Calculate the effective position (width or height) given a starting pos,
 * a placement (left, top, middle, etc...) and dir (ltr/rtl).
 */
function getEffectivePos(
  pos: number,
  length: number,
  placement: 'start' | 'end' | 'middle' | 'left' | 'right' | 'top' | 'bottom',
  dir: 'ltr' | 'rtl'
): number {
  if (placement === 'middle') {
    return pos - length / 2;
  } else if (
    (placement === 'start' && dir === 'ltr') ||
    (placement === 'end' && dir === 'rtl') ||
    placement === 'top' ||
    placement === 'left'
  ) {
    return Math.max(0, pos - length);
  }
  return pos;
}

export function getOppositeEffectivePos(
  pos: number,
  length: number,
  placement: 'start' | 'end' | 'middle' | 'left' | 'right' | 'top' | 'bottom',
  dir: 'ltr' | 'rtl'
): number {
  if (placement === 'middle') {
    return pos - length / 2;
  } else if (
    (placement === 'start' && dir === 'ltr') ||
    (placement === 'end' && dir === 'rtl') ||
    placement === 'top' ||
    placement === 'left'
  ) {
    return pos;
  }
  return pos - length;
}

/**
 * Set the position of the element so that it fits in the viewport.
 *
 * The element is first positioned at `location`.
 * If it overflows and there is an alternate location, use the alternate
 * location to fit the topright at the alternate location.
 *
 * If the element still overflows, adjust its location moving it up and to the
 * left as necessary until it fits (and adjusting its width/height as a result)
 */
export function fitInViewport(
  el: HTMLElement,
  options: {
    location: [x: number, y: number];
    alternateLocation?: [x: number, y: number];
    verticalPos: 'bottom' | 'top' | 'middle' | 'start' | 'end';
    horizontalPos: 'left' | 'right' | 'middle' | 'start' | 'end';
    width?: number;
    height?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): void {
  const dir = getComputedDir(el) ?? 'ltr';

  // Reset any location, so we can get the natural width/height
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.left = 'auto';
  el.style.top = 'auto';
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.height = 'auto';
  el.style.width = 'auto';

  const elementBounds = el.getBoundingClientRect();

  //
  // Vertical positioning
  //
  const maxHeight = isFinite(options.maxHeight)
    ? Math.min(options.maxHeight, window.innerHeight)
    : window.innerHeight;
  let height = Math.min(maxHeight, options.height ?? elementBounds.height);

  let top = getEffectivePos(
    options.location[1],
    height,
    options.verticalPos,
    dir
  );
  if (top + height > window.innerHeight - 8) {
    if (options.alternateLocation) {
      top = getEffectivePos(
        options.alternateLocation[1],
        height,
        options.verticalPos,
        dir
      );
      if (top + height > window.innerHeight - 8) {
        top = undefined;
      }
    } else {
      top = undefined;
    }
  }
  if (!isFinite(top)) {
    // Move element as high as possible
    top = Math.max(8, window.innerHeight - 8 - height);
    if (8 + height > window.innerHeight - 8) {
      // Still doesn't fit, we'll clamp it
      el.style.bottom = '8px';
    }
  }
  height = Math.min(top + height, window.innerHeight - 8) - top;

  //
  // Horizontal positioning
  //
  const maxWidth = isFinite(options.maxWidth)
    ? Math.min(options.maxWidth, window.innerWidth)
    : window.innerWidth;

  let width = Math.min(maxWidth, options.width ?? elementBounds.width);

  let left = getEffectivePos(
    options.location[0],
    width,
    options.horizontalPos,
    dir
  );
  if (left + width > window.innerWidth - 8) {
    if (options.alternateLocation) {
      left = getOppositeEffectivePos(
        options.alternateLocation[0],
        width,
        options.verticalPos,
        dir
      );
      if (left + width > window.innerWidth - 8) {
        left = undefined;
      }
    } else {
      left = undefined;
    }
  }
  if (!isFinite(left)) {
    // Move element as high as possible
    left = Math.max(8, window.innerWidth - 8 - width);
    if (8 + width > window.innerWidth - 8) {
      // Still doesn't fit, we'll clamp it
      el.style.right = '8px';
    }
  }
  width = Math.min(left + width, window.innerWidth - 8) - left;

  el.style.left = `${Math.round(left).toString()}px`;
  el.style.top = `${Math.round(top).toString()}px`;
  el.style.height = `${Math.round(height).toString()}px`;
  el.style.width = `${Math.round(width).toString()}px`;
}
