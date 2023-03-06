import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { choose } from "lit/directives/choose.js";
import { classMap } from "lit/directives/class-map.js";

export interface IOSignButtonElementAttributes {
  state: "inactive" | "activating" | "idle" | "loading";
}

import "./index.css";

@customElement("io-sign-button")
export class IOSignButtonElement
  extends LitElement
  implements IOSignButtonElementAttributes
{
  @property({ type: String })
  state: "inactive" | "activating" | "idle" | "loading" = "idle";

  static styles = css`
    :host {
      --main-blue: #0073e6;
      --dark-blue: #0062c3;
      --primary-color: var(--main-blue);
      --default-radius: 4px;
      --disabled: rgba(23, 50, 77, 0.26);
      --disabled-bg: rgba(23, 50, 77, 0.12);
      font-size: 16px;
    }

    img {
      display: block;
    }

    button {
      font-family: "Titillium Web";
      background-color: var(--primary-color);
      border: 0;
      min-height: 40px;
      color: white;
      font-size: 1em;
      padding: 0.5em 1.2em;
      border-radius: var(--default-radius);
      min-width: 155px;
      transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }

    button:hover {
      cursor: pointer;
      background-color: var(--dark-blue);
    }

    button.disabled {
      background-color: var(--disabled-bg);
      color: var(--disabled);
    }

    div.wrapper {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    rect.io-logo {
      fill: white;
    }

    .disabled rect.io-logo {
      fill: var(--disabled);
    }
  `;

  render() {
    const logo = html`
      <svg
        width="20"
        heigth="20"
        viewBox="0 0 84 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask
          id="mask0_0_3113"
          style="mask-type:luminance"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="84"
          height="72"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.95446 0.545898C13.8497 0.545898 17.8181 4.51428 17.8181 9.40953C17.8181 14.3048 13.8497 18.2732 8.95446 18.2732C4.05921 18.2732 0.0908203 14.3048 0.0908203 9.40953C0.0908203 4.51428 4.05921 0.545898 8.95446 0.545898ZM83.409 43.0908C83.409 58.7556 70.7102 71.4544 56.396 71.4544C39.3806 71.4544 26.6817 58.7556 26.6817 43.0908C26.6817 27.426 39.3806 14.7271 56.396 14.7271C70.7102 14.7271 83.409 27.426 83.409 43.0908ZM16.0449 34.2277C16.0449 30.3115 12.8702 27.1368 8.95402 27.1368C5.03782 27.1368 1.86311 30.3115 1.86311 34.2277V64.3641C1.86311 68.2803 5.03782 71.455 8.95402 71.455C12.8702 71.455 16.0449 68.2803 16.0449 64.3641V34.2277ZM62.0158 40.1134H65.7919V36.3978H62.043V31.9044H57.9409V46.8534C57.9409 49.2153 58.2669 50.8283 58.946 51.6924C59.598 52.5853 60.8477 53.0173 62.695 53.0173C63.4013 53.0173 64.4608 52.8445 65.8191 52.5277L65.6289 49.0713L63.2926 49.1289C62.8851 49.1289 62.5863 49.0425 62.3961 48.8409C62.206 48.6392 62.0973 48.4088 62.0701 48.1496C62.043 47.8615 62.0158 47.4295 62.0158 46.767V40.1134ZM49.652 36.4263V52.6426H53.7541V36.4263H49.652ZM43.4983 36.0242C44.2152 36.0242 44.8219 36.2657 45.2907 36.7486C45.7595 37.2316 45.9801 37.8219 45.9801 38.5463C45.9801 39.2707 45.7595 39.8341 45.2907 40.3171C44.8495 40.7464 44.2704 40.9879 43.5258 40.9879C42.8089 40.9879 42.2022 40.7464 41.7334 40.2634C41.2646 39.7805 41.0164 39.1902 41.0164 38.4926C41.0164 37.795 41.2646 37.2048 41.7058 36.7218C42.1746 36.2389 42.7813 36.0242 43.4983 36.0242Z"
            fill="white"
          />
        </mask>
        <g mask="url(#mask0_0_3113)">
          <rect
            x="-134.636"
            y="-141.272"
            width="354.545"
            height="354.545"
            class="io-logo"
          />
        </g>
      </svg>
    `;

    const classes = { disabled: this.state === "inactive" };
    return html`<button class="${classMap(classes)}">
      <div class="wrapper">
        ${choose(
          this.state,
          [
            ["activating", () => html`<io-skeleton></io-skeleton>`],
            ["loading", () => html`<io-spinner></io-spinner>`],
          ],
          () => html`${logo}<span>Firma con IO</span>`
        )}
      </div>
    </button>`;
  }
}
