import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

import { localized, msg, str } from "@lit/localize";

import "./ui/Dialog";

@localized()
@customElement("io-sign-qr-dialog")
export class ScanQrCodeDialogElement extends LitElement {
  @property({
    type: String,
  })
  signatureRequestId: string = "";

  get qrCodeUrl() {
    return `https://continua.io.pagopa.it/qrcode.png?feat=firma&srid=${this.signatureRequestId}&width=150&color=%2317324dff`;
  }

  static styles = css`
    main {
      font-family: "Titillium Web";
      color: #17324d;
    }
    main h1 {
      font-size: 1.625em;
    }
    .app-badges {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      padding: 10px;
    }
    .app-badges a {
      margin: 0 5px;
    }
    .qr-code {
      width: 150px;
      height: 150px;
    }
  `;

  render() {
    return html`<io-dialog>
      <main>
        <h1>${msg(str`Scan the QR code`)}</h1>
        <p>
          ${msg(html`To view and sign the documents with IO, <br />
            scan this code with your device`)}
        </p>
        <div>
          <img class="qr-code" src="${this.qrCodeUrl}" />
        </div>
        <span>${msg(str`Don’t have the IO app? Download it now`)}</span>
        <div class="app-badges">
          <a
            href="https://apps.apple.com/it/app/io/id1501681835"
            style="display: inline-block; overflow: hidden; border-radius: 13px"
            ><img
              src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/it-it?size=250x83&amp;releaseDate=1586995200"
              alt="Download on the App Store"
              style="border-radius: 13px; height: 40px; width: 120px"
          /></a>
          <a
            href="https://play.google.com/store/apps/details?id=it.pagopa.io.app"
            ><img
              alt="Disponibile su Google Play"
              style="height: 50px; width: 130px"
              src="https://play.google.com/intl/en_us/badges/static/images/badges/it_badge_web_generic.png"
          /></a>
        </div>
      </main>
    </io-dialog>`;
  }
}
