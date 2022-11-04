import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

import { pipe } from "fp-ts/lib/function";
import { GetIssuerBySubscriptionId, Issuer } from "../../issuer";

export const mockGetIssuerBySubscriptionId: GetIssuerBySubscriptionId = (
  subscriptionId
) =>
  pipe(
    Issuer.props.id.decode(`mock-issuer-${subscriptionId}`),
    E.map((id) => ({ id, subscriptionId })),
    O.fromEither,
    TE.right
  );
