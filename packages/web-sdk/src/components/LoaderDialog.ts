// Dialog component that show the loader of Signature Request creation

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { localized, msg, str } from "@lit/localize";

import hourglass from "../assets/hourglass.svg?raw";

import "./Dialog";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";

@localized()
@customElement("io-sign-loader-dialog")
export class LoaderDialogElement extends LitElement {
  static styles = css`
    h1 {
      font-size: 1.625em;
    }

    .body {
      color: #17324d;
      font-size: 16px;
    }
  `;

  //TODO:[SFEQS-1643] This is only a pleceholder. Waiting for figma
  render() {
    return html`<io-dialog>
      <div class="content">
        <h1>${msg(str`Loading...`)}</h1>
        <p>${msg(html`Caricamento in corso......`)}</p>
        ${unsafeSVG(hourglass)}
        <p class="body">${msg(html`Stiamo preparando i documenti...`)}</p>
      </div>
    </io-dialog>`;
  }
}
