import { createEffect } from './reactivity';

// Security: Sanitize dangerous attributes
const DANGEROUS_ATTRS = new Set(['innerHTML', 'outerHTML', 'insertAdjacentHTML']);
const EVENT_ATTRS = /^on[A-Z]/;

export type Props = Record<string, any> & { children?: any };
export type FC<P = {}> = (props: P & Props) => JSX.Element;

function sanitizeAttribute(key: string, value: any): boolean {
  if (DANGEROUS_ATTRS.has(key)) return false;
  if (key.includes('javascript:')) return false;
  return true;
}

function setProperty(element: HTMLElement, key: string, value: any) {
  if (!sanitizeAttribute(key, value)) return;
  
  if (key === 'className' || key === 'class') {
    element.className = String(value);
  } else if (key === 'classList' && typeof value === 'object') {
    Object.entries(value).forEach(([cls, active]) => {
      const isActive = typeof active === 'function' ? active() : active;
      element.classList.toggle(cls, Boolean(isActive));
    });
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(element.style, value);
  } else if (key === 'style') {
    element.style.cssText = String(value);
  } else if (key === 'value') {
    (element as any).value = value;
  } else if (key === 'checked') {
    (element as any).checked = Boolean(value);
  } else if (key === 'selected') {
    (element as any).selected = Boolean(value);
  } else if (key === 'disabled') {
    (element as any).disabled = Boolean(value);
  } else if (key === 'hidden') {
    (element as any).hidden = Boolean(value);
  } else if (key === 'textContent') {
    element.textContent = String(value);
  } else if (key === 'innerHTML') {
    element.innerHTML = String(value).replace(/<script[^>]*>.*?<\/script>/gi, '');
  } else if (key === 'ref' && typeof value === 'function') {
    value(element);
  } else if (key.startsWith('data-') || key.startsWith('aria-')) {
    element.setAttribute(key, String(value));
  } else {
    element.setAttribute(key, String(value));
  }
}

export function createElement(tag: string | FC, props: Props | null, ...children: any[]): JSX.Element {
  if (typeof tag === 'function') {
    return tag({ ...props, children: children.length ? children : undefined });
  }
  
  const element = document.createElement(tag);
  
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;
      
      if (EVENT_ATTRS.test(key) && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (typeof value === 'function' && key !== 'ref') {
        createEffect(() => {
          setProperty(element, key, value());
        });
      } else {
        setProperty(element, key, value);
      }
    }
  }
  
  const allChildren = children.length ? children : (props?.children ? [props.children] : []);
  
  allChildren.flat(Infinity).forEach(child => {
    if (typeof child === 'function') {
      const placeholder = document.createTextNode('');
      element.appendChild(placeholder);
      
      createEffect(() => {
        const result = child();
        
        let current = placeholder.nextSibling;
        while (current && current.previousSibling === placeholder) {
          const next = current.nextSibling;
          current.remove();
          current = next;
        }
        
        if (Array.isArray(result)) {
          result.forEach(item => {
            if (item?.nodeType) {
              element.insertBefore(item, placeholder.nextSibling);
            } else if (item != null) {
              element.insertBefore(document.createTextNode(String(item)), placeholder.nextSibling);
            }
          });
        } else if (result?.nodeType) {
          element.insertBefore(result, placeholder.nextSibling);
        } else if (result != null) {
          placeholder.textContent = String(result);
        }
      });
    } else if (child?.nodeType) {
      element.appendChild(child);
    } else if (child != null && child !== false && child !== undefined) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element as JSX.Element;
}

export function render(component: JSX.Element, container: Element) {
  container.innerHTML = '';
  container.appendChild(component as Node);
}

/**
 * Complete JSX Type Definitions
 */
export namespace JSX {
  export interface Element extends Node {}

  export interface IntrinsicElements {
    // HTML Elements
    a: HTMLAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement>;
    area: HTMLAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement>;
    audio: HTMLAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement>;
    base: HTMLAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement>;
    blockquote: HTMLAttributes<HTMLElement>;
    body: HTMLAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement>;
    button: HTMLAttributes<HTMLButtonElement>;
    canvas: HTMLAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLElement>;
    cite: HTMLAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement>;
    col: HTMLAttributes<HTMLTableColElement>;
    colgroup: HTMLAttributes<HTMLTableColElement>;
    data: HTMLAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement>;
    del: HTMLAttributes<HTMLElement>;
    details: HTMLAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement>;
    dialog: HTMLAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement>;
    embed: HTMLAttributes<HTMLEmbedElement>;
    fieldset: HTMLAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement>;
    form: HTMLAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement>;
    html: HTMLAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement>;
    iframe: HTMLAttributes<HTMLIFrameElement>;
    img: HTMLAttributes<HTMLImageElement>;
    input: HTMLAttributes<HTMLInputElement>;
    ins: HTMLAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement>;
    label: HTMLAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement>;
    li: HTMLAttributes<HTMLLIElement>;
    link: HTMLAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement>;
    map: HTMLAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement>;
    meta: HTMLAttributes<HTMLMetaElement>;
    meter: HTMLAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement>;
    object: HTMLAttributes<HTMLObjectElement>;
    ol: HTMLAttributes<HTMLOListElement>;
    optgroup: HTMLAttributes<HTMLOptGroupElement>;
    option: HTMLAttributes<HTMLOptionElement>;
    output: HTMLAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    picture: HTMLAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement>;
    progress: HTMLAttributes<HTMLProgressElement>;
    q: HTMLAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement>;
    script: HTMLAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement>;
    select: HTMLAttributes<HTMLSelectElement>;
    slot: HTMLAttributes<HTMLSlotElement>;
    small: HTMLAttributes<HTMLElement>;
    source: HTMLAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement>;
    style: HTMLAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement>;
    table: HTMLAttributes<HTMLTableElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement>;
    td: HTMLAttributes<HTMLTableCellElement>;
    template: HTMLAttributes<HTMLTemplateElement>;
    textarea: HTMLAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement>;
    th: HTMLAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement>;
    time: HTMLAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement>;
    track: HTMLAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement>;
    var: HTMLAttributes<HTMLElement>;
    video: HTMLAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement>;

    // SVG Elements
    svg: SVGAttributes<SVGSVGElement>;
    animate: SVGAttributes<SVGElement>;
    circle: SVGAttributes<SVGCircleElement>;
    clipPath: SVGAttributes<SVGClipPathElement>;
    defs: SVGAttributes<SVGDefsElement>;
    desc: SVGAttributes<SVGDescElement>;
    ellipse: SVGAttributes<SVGEllipseElement>;
    g: SVGAttributes<SVGGElement>;
    image: SVGAttributes<SVGImageElement>;
    line: SVGAttributes<SVGLineElement>;
    linearGradient: SVGAttributes<SVGLinearGradientElement>;
    mask: SVGAttributes<SVGMaskElement>;
    path: SVGAttributes<SVGPathElement>;
    pattern: SVGAttributes<SVGPatternElement>;
    polygon: SVGAttributes<SVGPolygonElement>;
    polyline: SVGAttributes<SVGPolylineElement>;
    radialGradient: SVGAttributes<SVGRadialGradientElement>;
    rect: SVGAttributes<SVGRectElement>;
    stop: SVGAttributes<SVGStopElement>;
    text: SVGAttributes<SVGTextElement>;
    tspan: SVGAttributes<SVGTSpanElement>;
    use: SVGAttributes<SVGUseElement>;
  }

  export interface HTMLAttributes<T = HTMLElement> extends DOMAttributes<T> {
    // Standard HTML Attributes
    accept?: string;
    acceptCharset?: string;
    accessKey?: string;
    action?: string;
    allow?: string;
    allowFullScreen?: boolean;
    alt?: string;
    async?: boolean;
    autoComplete?: string;
    autoFocus?: boolean;
    autoPlay?: boolean;
    capture?: boolean | string;
    cellPadding?: number | string;
    cellSpacing?: number | string;
    charSet?: string;
    checked?: boolean | (() => boolean);
    cite?: string;
    class?: string;
    className?: string | (() => string);
    cols?: number;
    colSpan?: number;
    content?: string;
    contentEditable?: boolean | 'inherit';
    controls?: boolean;
    coords?: string;
    crossOrigin?: string;
    data?: string;
    dateTime?: string;
    default?: boolean;
    defer?: boolean;
    dir?: string;
    disabled?: boolean | (() => boolean);
    download?: any;
    draggable?: boolean;
    encType?: string;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    frameBorder?: number | string;
    headers?: string;
    height?: number | string;
    hidden?: boolean | (() => boolean);
    high?: number;
    href?: string;
    hrefLang?: string;
    htmlFor?: string;
    httpEquiv?: string;
    id?: string;
    inputMode?: string;
    integrity?: string;
    is?: string;
    keyParams?: string;
    keyType?: string;
    kind?: string;
    label?: string;
    lang?: string;
    list?: string;
    loop?: boolean;
    low?: number;
    manifest?: string;
    marginHeight?: number;
    marginWidth?: number;
    max?: number | string;
    maxLength?: number;
    media?: string;
    mediaGroup?: string;
    method?: string;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    muted?: boolean;
    name?: string;
    noValidate?: boolean;
    open?: boolean;
    optimum?: number;
    pattern?: string;
    placeholder?: string;
    playsInline?: boolean;
    poster?: string;
    preload?: string;
    readOnly?: boolean;
    rel?: string;
    required?: boolean;
    reversed?: boolean;
    role?: string;
    rows?: number;
    rowSpan?: number;
    sandbox?: string;
    scope?: string;
    scrolling?: string;
    selected?: boolean | (() => boolean);
    shape?: string;
    size?: number;
    sizes?: string;
    slot?: string;
    span?: number;
    spellCheck?: boolean;
    src?: string;
    srcDoc?: string;
    srcLang?: string;
    srcSet?: string;
    start?: number;
    step?: number | string;
    style?: string | Partial<CSSStyleDeclaration> | (() => string);
    summary?: string;
    tabIndex?: number;
    target?: string;
    title?: string;
    type?: string;
    useMap?: string;
    value?: string | string[] | number | (() => string | number);
    width?: number | string;
    wrap?: string;

    // Data & ARIA
    [key: `data-${string}`]: string | number | boolean;
    [key: `aria-${string}`]: string | number | boolean;

    // Custom
    classList?: Record<string, boolean | (() => boolean)>;
    ref?: (el: T) => void;
  }

  export interface SVGAttributes<T = SVGElement> extends DOMAttributes<T> {
    // Core SVG attributes
    className?: string;
    class?: string;
    id?: string;
    lang?: string;
    style?: string | Partial<CSSStyleDeclaration> | (() => string);
    tabIndex?: number;
    
    // SVG Specific
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeDasharray?: string | number;
    strokeDashoffset?: string | number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    strokeLinejoin?: 'miter' | 'round' | 'bevel';
    strokeOpacity?: number | string;
    fillOpacity?: number | string;
    opacity?: number | string;
    
    // Geometry
    x?: number | string;
    y?: number | string;
    x1?: number | string;
    y1?: number | string;
    x2?: number | string;
    y2?: number | string;
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    rx?: number | string;
    ry?: number | string;
    width?: number | string;
    height?: number | string;
    
    // Paths
    d?: string;
    pathLength?: number | string;
    
    // Text
    textAnchor?: string;
    fontSize?: number | string;
    fontFamily?: string;
    fontWeight?: number | string;
    
    // Transform
    transform?: string;
    
    // Viewport
    viewBox?: string;
    preserveAspectRatio?: string;
    
    // Links
    href?: string;
    
    ref?: (el: T) => void;
  }

  export interface DOMAttributes<T = Element> {
    // Clipboard Events
    onCopy?: (event: ClipboardEvent) => void;
    onCut?: (event: ClipboardEvent) => void;
    onPaste?: (event: ClipboardEvent) => void;

    // Composition Events
    onCompositionEnd?: (event: CompositionEvent) => void;
    onCompositionStart?: (event: CompositionEvent) => void;
    onCompositionUpdate?: (event: CompositionEvent) => void;

    // Focus Events
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;

    // Form Events
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
    onReset?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    onInvalid?: (event: Event) => void;

    // Image Events
    onLoad?: (event: Event) => void;
    onError?: (event: Event) => void;

    // Keyboard Events
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;

    // Media Events
    onAbort?: (event: Event) => void;
    onCanPlay?: (event: Event) => void;
    onCanPlayThrough?: (event: Event) => void;
    onDurationChange?: (event: Event) => void;
    onEmptied?: (event: Event) => void;
    onEnded?: (event: Event) => void;
    onLoadedData?: (event: Event) => void;
    onLoadedMetadata?: (event: Event) => void;
    onLoadStart?: (event: Event) => void;
    onPause?: (event: Event) => void;
    onPlay?: (event: Event) => void;
    onPlaying?: (event: Event) => void;
    onProgress?: (event: Event) => void;
    onRateChange?: (event: Event) => void;
    onSeeked?: (event: Event) => void;
    onSeeking?: (event: Event) => void;
    onStalled?: (event: Event) => void;
    onSuspend?: (event: Event) => void;
    onTimeUpdate?: (event: Event) => void;
    onVolumeChange?: (event: Event) => void;
    onWaiting?: (event: Event) => void;

    // Mouse Events
    onClick?: (event: MouseEvent) => void;
    onContextMenu?: (event: MouseEvent) => void;
    onDoubleClick?: (event: MouseEvent) => void;
    onDrag?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDragEnter?: (event: DragEvent) => void;
    onDragExit?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDragStart?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;

    // Selection Events
    onSelect?: (event: Event) => void;

    // Touch Events
    onTouchCancel?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchStart?: (event: TouchEvent) => void;

    // Pointer Events
    onPointerDown?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
    onPointerEnter?: (event: PointerEvent) => void;
    onPointerLeave?: (event: PointerEvent) => void;
    onPointerOver?: (event: PointerEvent) => void;
    onPointerOut?: (event: PointerEvent) => void;

    // UI Events
    onScroll?: (event: Event) => void;

    // Wheel Events
    onWheel?: (event: WheelEvent) => void;

    // Animation Events
    onAnimationStart?: (event: AnimationEvent) => void;
    onAnimationEnd?: (event: AnimationEvent) => void;
    onAnimationIteration?: (event: AnimationEvent) => void;

    // Transition Events
    onTransitionEnd?: (event: TransitionEvent) => void;
  }
}

// Global JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface Element extends Node {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}