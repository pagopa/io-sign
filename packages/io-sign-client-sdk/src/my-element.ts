import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

import "./index.css";

import logoUrl from "./assets/IO.svg";

@customElement("my-element")
export class MyElement extends LitElement {
  static styles = css`
    :host {
      --main-blue: #0073e6;
      --dark-blue: #0062c3;
      --primary-color: var(--main-blue);
      font-size: 16px;
    }
    button {
      font-family: "Titillium Web";
      background-color: var(--primary-color);
      border: 1px solid var(--primary-color);
      color: white;
      font-size: 1em;
      padding: 0.5em 1.2em;
      border-radius: 5px;
      min-width: 155px;
      transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    }
    button:hover {
      cursor: pointer;
      background-color: var(--dark-blue);
    }
    img {
      width: 1.2em;
      display: block;
    }
    .wrap {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  `;

  render() {
    return html`<button>
      <div class="wrap">
        <img src="${logoUrl}"></img>
        Firma con IO
      </div>
    </button>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "my-element": MyElement;
  }
}
