import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import "./io-sign-button";

@customElement("io-sign")
export class IOSign extends LitElement {
  @state()
  btnStatus: "idle" | "loading" = "idle";

  _handleClick() {
    this.btnStatus = "loading";
  }

  render() {
    return html`<io-sign-btn
      @click=${this._handleClick}
      status=${this.btnStatus}
    ></io-sign-btn>`;
  }
}
