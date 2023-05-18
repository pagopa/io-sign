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
    :host {
      --io-button-bg-color: var(--io-primary-color, #0073e6);
    }
    button {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      font-family: var(--io-font-family, sans-serif);
      border: 0;
      height: 40px;
      font-size: 1em;
      font-weight: bold;
      padding: 0.5em 1.2em;
      border-radius: var(--io-border-radius, 4px);
      min-width: 155px;
      background: var(--io-button-bg-color);
      color: var(--io-button-color, white);
      transition: filter 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }
    button:hover:not(:disabled) {
      cursor: pointer;
      filter: brightness(0.9);
    }
    button:disabled {
      background-color: var(
        --io-button-disabled-bg-color,
        rgba(23, 50, 77, 0.12)
      );
      color: var(--io-button-disabled-color, rgba(23, 50, 77, 0.26));
    }
  `;

  render() {
    return html`<button disabled=${ifDefined(this.disabled)}>
      <slot></slot>
    </button>`;
  }
}
