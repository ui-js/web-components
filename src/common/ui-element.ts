import { Json } from './json';
import { dirty, Updatable } from './updatable';

/**
 * In general, the 'source of truth' should be a property rather than an
 * attribute.
 *
 * When that's the case, the property definition specifies how the attribute
 * and property should coordinate:
 * - read initial property value from attribute (or not if attribute = false)
 * - observe attribute: update property value when attribute is changed (or not )
 * - reflect property: update attribute value when property value is changed (or not)
 *
 * If the source of truth is an attribute, simply declare a get/set accessor
 * for the property that reads/write to the attribute.
 */
export type PropertyDefinition = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: String | Boolean | Number | Function | string[];
  default: string;
  /** If a string, reflect property to attribute with specified name
   * If true, reflect property to attribute named from property name (kebab-case
   * variant)
   * If false, don't initialize property with attribute value, attribute
   * changes will not affect property
   * Default: true
   */
  attribute: boolean | string;
  /**
   * When attribute is updated => property is updated
   * When property is updated:
   * If true => the attribute is updated
   * If false => the attribute is *not* updated
   * Default: false
   */
  reflect: boolean;
};

/**
 * - When the 'source of truth' is an attribute
 * - Adds property getter/setter reflecting the value of the attribute
 * - Use when the attribute is readonly (used for the construction of the element)
 * or rarely changed
 */
// export type AttributeDefinition = {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   type: String | Boolean | Number | Function | string[];
//   default: unknown;
// };

/**
 * @internal
 */
export abstract class UIElement extends HTMLElement implements Updatable {
  // Registry of UIElement classes to support `await ready()` in 'ui.ts'
  static registry: Record<string, CustomElementConstructor> = {};

  // The properties of this element and how they map to attributes
  static properties: Readonly<Record<string, PropertyDefinition>> = {};

  // Content of a `<script type='application/json'></script>` in the light DOM
  private _json?: Json;
  // Content of a `<style></style>` in the light DOM
  private _style?: HTMLStyleElement | null;

  constructor(options?: {
    template: string | HTMLTemplateElement;
    style: string | HTMLTemplateElement;
  }) {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });

    if (options?.template instanceof HTMLTemplateElement) {
      shadowRoot.append(options.template.content.cloneNode(true));
    } else if (typeof options?.template === 'string') {
      shadowRoot.innerHTML = options.template;
    }

    if (options?.style instanceof HTMLTemplateElement) {
      shadowRoot.append(options.style.content.cloneNode(true));
    } else if (typeof options?.style === 'string') {
      const style = document.createElement('style');
      style.textContent = options.style;
      shadowRoot.append(style);
    }
  }

  static async register(options: {
    tag: string;
    className: string;
    constructor: CustomElementConstructor;
  }): Promise<void | CustomElementConstructor> {
    UIElement.registry[options.tag] = options.constructor;

    if (!window.customElements?.get(options.tag)) {
      (window as { [key: string]: any })[options.className] =
        options.constructor;
      window.customElements?.define(options.tag, options.constructor);
    }

    if (window.customElements) {
      return window.customElements.whenDefined(options.tag);
    }

    return Promise.reject<void>(new Error('web components not supported'));
  }

  private static getAttributeNameForProperty(p: string): string | null {
    if (!this.properties[p]) return null;
    if (typeof this.properties[p].attribute === 'boolean') {
      if (this.properties[p].attribute) {
        return toKebabCase(p);
      }
      return null;
    } else if (typeof this.properties[p].attribute === 'string') {
      return this.properties[p].attribute as string;
    }
    return null;
  }

  static get observedAttributes(): string[] {
    const attributes: string[] = [];

    for (const prop of Object.keys(this.properties)) {
      const attr = UIElement.getAttributeNameForProperty(prop);
      if (attr) attributes.push(attr);
    }

    // @todo: add observed attributes from parent class, if any

    return attributes;
  }

  set dirty(value: boolean) {
    if (value) dirty(this);
  }

  /**
   * Declare that an attribute should be reflected as a property
   */
  reflectStringAttribute(attrName: string, propName = attrName): void {
    // Attributes should be all lower case, kebab-case.
    console.assert(attrName.toLowerCase() === attrName);
    Object.defineProperty(this, propName, {
      enumerable: true,
      get(): string {
        return this.getAttribute(attrName);
      },
      set(value: string) {
        this.setAttribute(attrName, value);
      },
    });
  }

  /**
   * Declare that an attribute should be reflected as a property
   */
  reflectBooleanAttribute(attrName: string, propName = attrName): void {
    // Attributes should be all lower case, kebab-case.
    console.assert(attrName.toLowerCase() === attrName);
    Object.defineProperty(this, propName, {
      enumerable: true,
      get(): boolean {
        return this.hasAttribute(attrName);
      },
      set(value: boolean) {
        if (value) {
          this.setAttribute(attrName, '');
        } else {
          this.removeAttribute(attrName);
        }
      },
    });
  }

  /**
   * Declare that an attribute should be reflected as a property
   */
  reflectEnumAttribute(
    attrName: string,
    attrValues: string[],
    propName = attrName
  ): void {
    // Attributes should be all lower case, kebab-case.
    console.assert(attrName.toLowerCase() === attrName);
    Object.defineProperty(this, propName, {
      enumerable: true,
      get(): string {
        let value: string | undefined;
        for (const x of attrValues) {
          if (this.hasAttribute(x)) {
            console.assert(
              value === undefined,
              `inconsistent ${attrName} attributes on ${this}`
            );
            value = x;
          }
        }
        if (value !== undefined) return value;
        return this.getAttribute(attrName);
      },
      set(value: string) {
        this.setAttribute(attrName, value);
        this.setAttribute(value, '');
        for (const x of attrValues) {
          if (x !== value) {
            this.removeAttribute(x);
          }
        }
      },
    });
  }

  reflectBooleanAttributes(
    attrNames: (string | [attrName: string, propName: string])[]
  ): void {
    for (const x of attrNames) {
      if (typeof x === 'string') {
        this.reflectBooleanAttribute(x);
      } else {
        this.reflectBooleanAttribute(x[0], x[1]);
      }
    }
  }

  reflectStringAttributes(
    attrNames: (string | [attrName: string, propName: string])[]
  ): void {
    for (const x of attrNames) {
      if (typeof x === 'string') {
        this.reflectStringAttribute(x);
      } else {
        this.reflectStringAttribute(x[0], x[1]);
      }
    }
  }

  get computedDir(): 'rtl' | 'ltr' {
    return getComputedDir(this);
  }

  /**
   * @internal
   */
  connectedCallback(): void {
    // this.update();
  }

  /**
   * @internal
   */
  disconnectedCallback(): void {
    return;
  }

  /**
   * @internal
   */
  protected get json(): Json {
    if (this._json !== undefined) return this._json;

    this._json = null;
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot');
    if (!slot) return null;
    const json: string = slot
      .assignedElements()
      .filter(
        (x) =>
          x.tagName === 'SCRIPT' &&
          (x as HTMLScriptElement).type === 'application/json'
      )
      .map((x) => x.textContent)
      .join('');

    if (!json) return null;

    try {
      this._json = JSON.parse(json);
    } catch (error: any) {
      // @todo: do this if __DEV__ only
      // There was an error parsing the JSON.
      // Display a helpful message.
      const message = error.toString();
      const m = message.match(/position (\d+)/);
      if (m) {
        const index = Number.parseInt(m[1]);
        const extract = json.substring(Math.max(index - 40, 0), index);
        throw new Error(`${message}\n${extract.trim()}`);
      } else {
        throw error;
      }
    }

    return this._json!;
  }

  /**
   * @internal
   */
  protected get importedStyle(): HTMLStyleElement | null {
    if (this._style !== undefined) return this._style;

    let stylesheet = '';
    const slot = this.shadowRoot?.querySelector<HTMLSlotElement>('slot');
    if (slot) {
      stylesheet = slot
        .assignedElements()
        .filter((x) => x.tagName === 'STYLE')
        .map((x) => x.textContent)
        .join('')
        .trim();
    }
    if (stylesheet.length === 0) {
      this._style = null;
    } else {
      this._style = document.createElement('style');
      this._style.textContent = stylesheet;
    }

    return this._style;
  }

  /** If there is an embedded <style> tag in the slot
   *  "import" it in the shadow dom
   */
  importStyle(): void {
    if (this.importedStyle) {
      this.shadowRoot?.append(this.importedStyle.cloneNode(true));
    }
  }

  update(): void {
    if (!this.isConnected) return;

    // Iterate over all the nodes and remove them
    // (ensures that eventHandlers are removed, unlike innerHTML = '')
    while (this.shadowRoot?.firstChild) {
      this.shadowRoot.firstChild.remove();
    }

    // Add new nodes
    const child = this.render();
    if (child) this.shadowRoot?.append(child);

    this.importStyle();
  }

  /**
   * Return a `HTMLElement` that will get attached to the root of
   * this element.
   * Event handlers should get added as well.
   */
  render(): HTMLElement | null {
    return null;
  }
}

/**
 * An element can have multiple 'parts', which function as a kind of
 * parallel classList.
 *
 * Add a part name to the part list of this element.
 */
export function addPart(element: HTMLElement, part: string): void {
  if (!element) return;
  const current = element.getAttribute('part') ?? '';
  if (!current.includes(part)) {
    element.setAttribute('part', `${current} ${part}`);
  }
}

/**
 * Remove a part name from the part list of this element.
 */
export function removePart(element: HTMLElement, part: string): void {
  if (!element) return;
  const current = element.getAttribute('part') ?? '';
  if (current.includes(part)) {
    element.setAttribute(
      'part',
      current.replace(new RegExp('\\bs*' + part + 's*\\b', 'g'), '')
    );
  }
}

export function getComputedDir(element: HTMLElement): 'ltr' | 'rtl' {
  if (element.dir && element.dir !== 'auto') {
    return element.dir as 'ltr' | 'rtl';
  }
  if (element.parentElement) return getComputedDir(element.parentElement);
  return 'ltr';
}

export function getOppositeEdge(
  bounds: DOMRectReadOnly,
  position: 'leading' | 'trailing' | 'left' | 'end',
  direction: 'ltr' | 'rtl'
): number {
  if (
    position === 'left' ||
    (position === 'leading' && direction === 'ltr') ||
    (position === 'trailing' && direction === 'rtl')
  ) {
    return bounds.right;
  }

  return bounds.left;
}

export function getEdge(
  bounds: DOMRectReadOnly,
  position: 'leading' | 'trailing' | 'left' | 'end',
  direction: 'ltr' | 'rtl'
): number {
  if (
    position === 'left' ||
    (position === 'leading' && direction === 'ltr') ||
    (position === 'trailing' && direction === 'rtl')
  ) {
    return bounds.left;
  }

  return bounds.right;
}

function toKebabCase(s: string): string {
  return s
    .match(
      /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
    )!
    .map((x: string) => x.toLowerCase())
    .join('-');
}

export function toCamelCase(s: string): string {
  return s.toLowerCase().replace(/[^a-zA-Z\d]+(.)/g, (m, c) => c.toUpperCase());
}
