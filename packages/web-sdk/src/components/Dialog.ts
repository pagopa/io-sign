// A dialog component with a backdrop

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import closeIcon from "../assets/close-icon.svg?raw";

@customElement("io-dialog")
export class IODialogElement extends LitElement {
  showCloseButton: string;
  constructor() {
    super();
    this.showCloseButton = "true";
  }

  static get properties() {
    return {
      showCloseButton: {
        type: String,
        attribute: "show-close-button",
      },
    };
  }
  static styles = css`
    .backdrop {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(23, 24, 26, 0.4);
    }
    .dialog {
      font-family: var(--io-font-family, sans-serif);
      color: var(--io-dialog-color, #17324d);
      background-color: var(--io-dialog-bg-color, white);
      text-align: center;
      border-radius: var(--io-border-radius, 4px);
      padding: 1em;
      min-width: 300px;
    }
    .dialog header {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
    }
    .dialog button.close {
      border: 0;
      background: transparent;
      padding: 0;
      margin: 0;
    }
    .dialog button.close:hover {
      filter: brightness(0.9);
      cursor: pointer;
    }
  `;

  handleClick(e: Event) {
    e.stopPropagation();
  }

  dispatchClose() {
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  }

  render() {
    return html`<div class="backdrop" @click=${this.dispatchClose}>
      <div class="dialog" @click=${this.handleClick}>
        <header>
          ${this.showCloseButton === "true"
            ? html`
                <button class="close" @click=${this.dispatchClose}>
                  ${unsafeSVG(closeIcon)}
                </button>
              `
            : html``}
        </header>
        <main>
          <slot></slot>
        </main>
      </div>
    </div>`;
  }
}
