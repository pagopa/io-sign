import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

export type IOButtonElementAttributes = {
  disabled?: "disabled";
};

@customElement("io-button")
export class IOButtonElement
  extends LitElement
  implements IOButtonElementAttributes
{
  @property()
  disabled?: "disabled";

  static styles = css`
    button {
      border: 0;
      height: 40px;
      font-size: 1em;
      padding: 0.5em 1.2em;
      border-radius: 5px;
      min-width: 155px;
      background: yellow;
    }
    button:hover {
      background: red;
    }
    button:disabled {
      background: gray;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  render() {
    return html`<button disabled=${ifDefined(this.disabled)}>
      <slot></slot>
    </button>`;
  }
}
