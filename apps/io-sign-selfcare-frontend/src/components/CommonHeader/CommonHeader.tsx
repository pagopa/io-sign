import { Fragment } from "react";
import { HeaderAccount } from "@pagopa/mui-italia/dist/components/HeaderAccount/HeaderAccount";
import { RootLinkType, JwtUser } from "@pagopa/mui-italia";
import { CONFIG } from "../../config";
type HeaderProps = {
  /** The logged user or false if there is not a valid session */
  loggedUser: JwtUser | false;
  /** If the user is not signed in, the support button will prompt him to send an email to this address; otherwise, it will lead him to the aid form. */
  assistanceEmail: string;
  /** The function that will be called when the rendered logout button is pressed; if undefined, no logout button will be rendered; otherwise, it will redirect to the logout page on click. The logout path can be changed by altering the value in `CONFIG.logout` located inside the `index.tsx` file. */
  onExit?: (exitAction: () => void) => void;
  /** If false hides login button  */
  enableLogin?: boolean;
  /** If false hides assistance button */
  enableAssistanceButton?: boolean;
};

const rootLink: RootLinkType = {
  label: CONFIG.HEADER.LABEL,
  href: CONFIG.HEADER.LINK.ROOTLINK,
  ariaLabel: "Link: vai al sito di PagoPA S.p.A.",
  title: "Sito di PagoPA S.p.A.",
};

const selfCareLogoutUrl = CONFIG.SELFCARE.LOGOUTLINK;

const CommonHeader = ({
  loggedUser,
  assistanceEmail,
  enableLogin = true,
  onExit = (exitAction) => exitAction(),
  enableAssistanceButton = true,
}: HeaderProps) => {
  return (
    <Fragment>
      <header>
        <HeaderAccount
          rootLink={rootLink}
          loggedUser={loggedUser}
          onAssistanceClick={() =>
            onExit(() => window.location.assign(`mailto:${assistanceEmail}`))
          }
          onLogout={() =>
            onExit(() => window.location.assign(selfCareLogoutUrl))
          }
          enableLogin={enableLogin}
          enableAssistanceButton={enableAssistanceButton}
        />
      </header>
    </Fragment>
  );
};

export default CommonHeader;
