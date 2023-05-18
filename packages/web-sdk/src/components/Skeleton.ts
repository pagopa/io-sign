// A component for displaying the structure of a widget and/or a page during their initial loading.

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("io-skeleton")
export class IOSkeletonElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      height: 1em;
      position: relative;
      overflow: hidden;
      width: 100%;
      border-radius: 5px;
      background-color: var(--io-skeleton-bg-color, rgb(255, 255, 255, 0.3));
    }
    @keyframes translate {
      100% {
        transform: translateX(100%);
      }
    }
    span {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0,
        rgba(255, 255, 255, 0.2) 20%,
        rgba(255, 255, 255, 0.3) 60%,
        rgba(255, 255, 255, 0)
      );
      animation: translate 2s infinite;
    }
  `;

  render() {
    return html`<span></span>`;
  }
}
