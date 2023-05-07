// An animated spinner component

import { LitElement, css } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit-html/directives/unsafe-svg.js";

import spinner from "../assets/spinner.svg?raw";

@customElement("io-spinner")
export class IOSpinnerElement extends LitElement {
  static styles = css`
    stop {
      stop-color: var(--io-spinner-color, white);
    }
    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
    :host {
      display: inline-flex;
      margin: 0 auto;
      animation: spin 1s linear infinite;
    }
  `;

  render() {
    return unsafeSVG(spinner);
  }
}
