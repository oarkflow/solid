import { createEffect } from './reactivity.js';

export type Props = Record<string, any> & { children?: any };
export type FC<P = {}> = (props: P & Props) => JSX.Element;

export function createElement(tag: string | FC, props: Props | null, ...children: any[]): JSX.Element {
  if (typeof tag === 'function') {
    return tag({ ...props, children: children.length ? children : undefined });
  }
  
  const element = document.createElement(tag);
  
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;
      if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'value' && typeof value === 'function') {
        createEffect(() => {
          (element as HTMLInputElement).value = String(value());
        });
      } else if (typeof value === 'function') {
        createEffect(() => {
          element.setAttribute(key, String(value()));
        });
      } else {
        element.setAttribute(key, String(value));
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
        
        // Clear previous content
        let current = placeholder.nextSibling;
        while (current && current.previousSibling === placeholder) {
          const next = current.nextSibling;
          current.remove();
          current = next;
        }
        
        // Insert new content
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
    } else if (child != null && child !== false) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element as JSX.Element;
}

export function render(component: JSX.Element, container: Element) {
  container.innerHTML = '';
  container.appendChild(component as Node);
}

declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
    interface IntrinsicElements {
      div: any;
      span: any;
      h1: any;
      h2: any;
      button: any;
      input: any;
      form: any;
      ul: any;
      li: any;
      hr: any;
      p: any;
      [elemName: string]: any;
    }
  }
}