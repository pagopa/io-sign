import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

export type IOButtonElementAttributes = {
  disabled?: "disabled";
};

import "../index.css";

@customElement("io-button")
export class IOButtonElement
  extends LitElement
  implements IOButtonElementAttributes
{
  @property()
  disabled?: "disabled";

  static styles = css`
    :host {
      --main-blue: #0073e6;
      --dark-blue: #0062c3;
      --primary-color: var(--main-blue);
      --radius: 4px;
      --color: white;
      --bg-color: var(--primary-color);
      --disabled-color: rgba(23, 50, 77, 0.26);
      --disabled-bg-color: rgba(23, 50, 77, 0.12);
      --font-family: "Titillium Web";
    }

    button {
      font-family: var(--font-family);
      border: 0;
      height: 40px;
      font-size: 1em;
      font-weight: bold;
      padding: 0.5em 1.2em;
      border-radius: var(--radius);
      min-width: 155px;
      background: var(--bg-color);
      color: var(--color);
      transition: filter 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }
    button:hover:not(:disabled) {
      cursor: pointer;
      filter: brightness(0.9);
    }
    button:disabled {
      background-color: var(--disabled-bg-color);
      color: var(--disabled-color);
    }
  `;

  render() {
    return html`<button disabled=${ifDefined(this.disabled)}>
      <slot></slot>
    </button>`;
  }
}
