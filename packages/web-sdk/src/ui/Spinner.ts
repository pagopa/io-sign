import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

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
    return html`
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M2 12C2 17.5228 6.47715 22 12 22C12.5523 22 13 22.4477 13 23C13 23.5523 12.5523 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 12.5523 23.5523 13 23 13C22.4477 13 22 12.5523 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12Z"
          fill="url(#paint0_angular_117_32)"
        />
        <defs>
          <radialGradient
            id="paint0_angular_117_32"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(12 12) rotate(15.2551) scale(12.4383)"
          >
            <stop offset="0.203125" stop-opacity="0" />
            <stop offset="0.5" />
            <stop offset="1" />
          </radialGradient>
        </defs>
      </svg>
    `;
  }
}
