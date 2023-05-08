// Dialog component that show the loader of Signature Request creation

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { localized, msg, str } from "@lit/localize";

import { styleMap } from "lit/directives/style-map.js";

import "./Spinner";
import "./Dialog";

@localized()
@customElement("io-sign-loader-dialog")
export class LoaderDialogElement extends LitElement {
  static styles = css`
    h1 {
      font-size: 1.625em;
    },
  `;

  //TODO:[SFEQS-1643] This is only a pleceholder. Waiting for figma
  render() {
    return html`<io-dialog>
      <div class="content">
        <h1>${msg(str`Loading...`)}</h1>
        <p>
          ${msg(
            html`We have started the process of creating the request for
              signature. <br />
              In a few seconds you will be able to sign via the IO app.`
          )}
        </p>
        <io-spinner
          style=${styleMap({
            "--io-spinner-color": "black",
          })}
        ></io-spinner>
      </div>
    </io-dialog>`;
  }
}
