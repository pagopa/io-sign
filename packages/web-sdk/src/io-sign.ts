import { LitElement, html, css } from "lit";
import { customElement, state, property } from "lit/decorators.js";

import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";

import { localized, configureLocalization } from "@lit/localize";

import { sourceLocale, targetLocales } from "./i18n/locale";

import * as templates_it from "./i18n/locales/it";

import { unsafeSVG } from "lit/directives/unsafe-svg.js";

import IOLogo from "./assets/io-logo.svg?raw";

const localizedTemplates = new Map([["it", templates_it]]);

export const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: async (locale) => {
    const templates = localizedTemplates.get(locale);
    if (typeof templates === "undefined") {
      throw new Error(`Unable to local ${locale} locale: templates not found.`);
    }
    return templates;
  },
});

setLocale("it");

import "./ui/Button";
import "./ui/Skeleton";
import "./ui/Spinner";

import "./io-sign-qr-dialog";

import "./index.css";

export type IOSignElementAttributes = {
  disabled?: "disabled";
};

@customElement("io-sign")
@localized()
export class IOSignElement
  extends LitElement
  implements IOSignElementAttributes
{
  @property()
  disabled?: "disabled";

  @state()
  state: "idle" | "loading" = "idle";

  @state()
  requestId?: string;

  static styles = css`
    .io-sign-button-content {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  `;

  clickHandler() {
    this.state = "loading";
    this.dispatchEvent(
      new Event("io-sign-click", {
        bubbles: true,
      })
    );
    this.continue("XAAA");
  }

  continue(signatureRequestId: string) {
    this.requestId = signatureRequestId;
  }

  reset() {
    this.requestId = undefined;
    this.state = "idle";
  }

  render() {
    return html`<io-button
        @click=${this.clickHandler}
        disabled=${ifDefined(this.disabled)}
      >
        <div class="io-sign-button-content">
          ${when(
            this.state === "loading",
            () => html`<io-spinner></io-spinner>`,
            () => html`${unsafeSVG(IOLogo)} Firma con IO`
          )}
        </div>
      </io-button>
      ${when(
        this.requestId,
        () => html`<io-sign-qr-dialog
          .signatureRequestId=${this.requestId}
          @close=${this.reset}
        ></io-sign-qr-dialog>`
      )}`;
  }
}
