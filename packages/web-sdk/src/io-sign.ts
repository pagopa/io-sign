import { LitElement, html } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { when } from "lit/directives/when.js";
import { choose } from "lit/directives/choose.js";
import { unsafeSVG } from "lit/directives/unsafe-svg.js";
import { localized } from "@lit/localize";
import { provide } from "@lit-labs/context";

import { IOSignLinkProvider, IOLinkProviderContext } from "./link-provider";
import { setLocaleFromUserSettings } from "./i18n";

import IOLogo from "./assets/io-logo.svg?raw";

import "./components/Button";
import "./components/Skeleton";
import "./components/Spinner";
import "./components/QrCodeDialog";
import "./components/LoaderDialog";

setLocaleFromUserSettings();

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
  state: "idle" | "activating" | "loading" = "activating";

  @state()
  signatureRequestId?: string;

  @state()
  showQrCode = false;

  @provide({ context: IOLinkProviderContext })
  @property({ attribute: false })
  IOLinkProvider = new IOSignLinkProvider();

  theme: HTMLLinkElement | null = null;

  // Due to Web Component limitations, it's not possible to
  // declare custom fonts inside the component-scoped CSS
  // So we inject an external stylesheet (at VITE_THEME_URL)
  // into <head> element of the document when the component
  // is mounted to the page.
  // When the external CSS is mounted and loaded ("load" event)
  // we set this component as "idle" (ready to be clicked).
  connectedCallback() {
    super.connectedCallback();
    const theme = document.getElementById("io-sign-theme-css");
    if (theme === null) {
      const el = document.createElement("link");
      el.id = "io-sign-theme-css";
      el.rel = "stylesheet";
      el.href = import.meta.env.VITE_THEME_URL;
      el.addEventListener("load", () => {
        this.state = "idle";
      });
      this.theme = document.head.appendChild(el);
    } else {
      this.state = "idle";
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.theme !== null) {
      document.head.removeChild(this.theme);
    }
  }

  handleClick(e: Event) {
    e.preventDefault();
    if (this.disabled || this.state !== "idle") {
      return;
    }
    this.state = "loading";
    this.dispatchEvent(
      new Event("io-sign.cta.click", {
        bubbles: true,
        composed: true,
      })
    );
  }

  handleClose() {
    this.showQrCode = false;
  }

  reset() {
    this.state = "idle";
    this.signatureRequestId = undefined;
    this.showQrCode = false;
  }

  // Show the QrCode dialog or redirect the user to the IO App
  redirectOrShowQrCode(signatureRequestId: string) {
    this.state = "idle";
    this.signatureRequestId = signatureRequestId;
    const isMobile = /iPhone|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const IOLink = new URL(
        `/fci/main?signatureRequestId=${this.signatureRequestId}`,
        import.meta.env.VITE_IO_LINK_BASE_URL
      );
      window.location.href = IOLink.href;
    } else {
      this.showQrCode = true;
    }
  }

  render() {
    return html`<io-button
        @click=${this.handleClick}
        disabled=${ifDefined(this.disabled)}
      >
        ${choose(
          this.state,
          [
            ["activating", () => html`<io-skeleton></io-skeleton>`],
            ["loading", () => html`<io-spinner></io-spinner>`],
          ],
          () => html`${unsafeSVG(IOLogo)} Firma con IO`
        )}
      </io-button>
      ${when(
        this.showQrCode && this.signatureRequestId,
        () => html`<io-sign-qr-dialog
          .signatureRequestId=${this.signatureRequestId}
          @close=${this.handleClose}
        ></io-sign-qr-dialog>`
      )}
      ${when(
        this.state === "loading",
        () => html`<io-sign-loader-dialog
          @close=${this.handleClose}
        ></io-sign-loader-dialog>`
      )}`;
  }
}
