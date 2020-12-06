export class Scrim {
    private _element: HTMLElement;

    private dismissOnClick: boolean;
    private onHide: () => void;

    private savedOverflow: string;
    private savedMarginRight: string;

    private savedActiveElement: HTMLOrSVGElement;

    private state: 'closed' | 'opening' | 'open' | 'closing';

    private translucent: boolean;

    /**
     * - If `options.dismissOnClick` is true, the scrim is dismissed if the
     * user clicks on the scrim. That's the behavior for menus, for example.
     * - `onHide()` is called when the scrim is being hidden
     * -
     */
    constructor(options?: {
        translucent?: boolean;
        dismissOnClick?: boolean;
        onHide?: () => void;
    }) {
        this.dismissOnClick = options?.dismissOnClick ?? false;
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

    show(options: { root?: Node; child?: HTMLElement }): void {
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

        const marginRight = parseFloat(
            getComputedStyle(document.body).marginRight
        );

        document.body.style.marginRight = `${marginRight + scrollbarWidth}px`;

        if (options?.child) {
            el.appendChild(options.child);
        }
        this.state = 'open';
    }

    hide(): void {
        if (this.state !== 'open') return;
        this.state = 'closing';

        if (typeof this.onHide === 'function') this.onHide();

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
        if (ev.type === 'click' && this.dismissOnClick) {
            this.hide();
            ev.preventDefault();
            ev.stopPropagation();
            return;
        } else if (
            ev.target === document &&
            (ev.type === 'touchmnove' || ev.type === 'scroll')
        ) {
            // This is an attempt at scrolling on a touch-device
            this.hide();
            ev.preventDefault();
            ev.stopPropagation();
            return;
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
