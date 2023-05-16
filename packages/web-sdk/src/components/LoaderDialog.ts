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
    p {
      font-size: 1.5em;
      line-height: 28px;
    }
    .content {
      margin-top: 40%;
      margin-bottom: 40%;
    }
  `;

  render() {
    return html`<io-dialog>
      <div class="content">
        <p>${msg(html`Stiamo preparando i<br />documenti...`)}</p>
        <io-spinner
          style=${styleMap({
            "--io-spinner-color": "#0073E6",
            "--io-spinner-size": "40px",
          })}
        ></io-spinner>
      </div>
    </io-dialog>`;
  }
}
