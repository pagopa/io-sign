import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("io-dialog")
export class IODialogElement extends LitElement {
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
      background-color: white;
      text-align: center;
      border-radius: 4px;
      padding: 1em;
      min-width: 300px;
    }

    .close-btn {
      border: 0;
      background: transparent;
      padding: 0;
      margin: 0;
    }

    .close-btn:hover {
      filter: brightness(0.9);
      cursor: pointer;
    }

    header {
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
    }
  `;

  _handleClose() {
    this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
  }

  render() {
    const closeIcon = html`<svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask
        id="mask0_5971_7089"
        style="mask-type:luminance"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="14"
        height="14"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M12.8101 13.7071C12.4457 14.0976 11.8547 14.0976 11.4902 13.7071L6.55018 8.41421L1.61015 13.7071C1.24566 14.0976 0.654702 14.0976 0.290213 13.7071C-0.0742766 13.3166 -0.0742766 12.6834 0.290213 12.2929L5.23025 7L0.290213 1.70711C-0.0742769 1.31658 -0.0742769 0.683418 0.290213 0.292893C0.654702 -0.0976311 1.24566 -0.0976311 1.61015 0.292893L6.55018 5.58579L11.4902 0.292893C11.8547 -0.0976311 12.4457 -0.0976311 12.8101 0.292893C13.1746 0.683418 13.1746 1.31658 12.8101 1.70711L7.87011 7L12.8101 12.2929C13.1746 12.6834 13.1746 13.3166 12.8101 13.7071Z"
          fill="white"
        />
      </mask>
      <g mask="url(#mask0_5971_7089)">
        <rect
          x="-38.2666"
          y="-34"
          width="93.3333"
          height="100"
          fill="#0073E6"
        />
      </g>
    </svg>`;

    return html`<div class="backdrop">
      <div class="dialog">
        <header>
          <button class="close-btn" @click=${this._handleClose}>
            ${closeIcon}
          </button>
        </header>
        <main>
          <slot></slot>
        </main>
      </div>
    </div>`;
  }
}
