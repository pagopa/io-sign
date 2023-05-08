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
        <h1>${msg(str`Caricamento in corso...`)}</h1>
        <p>
          ${msg(
            html`Abbiamo avviato il processo di creazione della richiesta di
              firma. <br />
              Tra qualche secondo potrai firmare tramite l'app IO.`
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
