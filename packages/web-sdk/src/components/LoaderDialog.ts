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
    h6 {
      font-size: 1.5em;
      line-height: 28px;
    }
  `;

  //TODO:[SFEQS-1643] This is only a pleceholder. Waiting for figma
  render() {
    return html`<io-dialog>
      <div class="content">
        <p>${msg(html`Stiamo preparando i<br />documenti...`)}</p>
        <io-spinner
          style=${styleMap({
            "--io-spinner-color": "#0073E6",
          })}
        ></io-spinner>
      </div>
    </io-dialog>`;
  }
}
