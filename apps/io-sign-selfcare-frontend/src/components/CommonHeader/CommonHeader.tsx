import { Fragment } from "react";
import { HeaderAccount } from "@pagopa/mui-italia/dist/components/HeaderAccount/HeaderAccount";
import { RootLinkType, JwtUser } from "@pagopa/mui-italia";
import { CONFIG } from "../../config";
type HeaderProps = {
  /** The logged user or false if there is not a valid session */
  loggedUser: JwtUser | false;
  /** The email to which the assistance button will ask to send an email, if the user is not logged in, otherwise it will be redirect to the assistance form */
  assistanceEmail: string;
  /** The function to be invoked when pressing the rendered logout button, if not defined it will redirect to the logout page, if setted to null it will no render the logout button. It's possible to modify the logout path changing the value in CONFIG.logout inside the index.tsx file */
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
