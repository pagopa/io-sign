// Dialog component that show the loader of Signature Request creation

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { localized, msg } from "@lit/localize";
import { styleMap } from "lit/directives/style-map.js";

import "./Dialog";

@localized()
@customElement("io-sign-loader-dialog")
export class LoaderDialogElement extends LitElement {
  static styles = css`
    h2 {
      font-size: 1.625em;
      font-family: "Titillio Semibold Woff", sans-serif;
      font-weight: 400;
    }
    .content {
      margin-top: 40%;
      margin-bottom: 40%;
    }
  `;

  render() {
    return html`<io-dialog>
      <div class="content">
        <io-spinner
          style=${styleMap({
            "--io-spinner-color": "#0B3EE3",
            "--io-spinner-size": "40px",
          })}
        ></io-spinner>
        <h2>${msg(html`Stiamo preparando i<br />documenti...`)}</h2>
      </div>
    </io-dialog>`;
  }
}
