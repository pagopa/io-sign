import { pipe } from "fp-ts/lib/function";

import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { BillingEvent, SendBillingEvent } from "@io-sign/io-sign/event";
import { EventHubProducerClient } from "@azure/event-hubs";

export const makeSendBillingEvent =
  (client: EventHubProducerClient): SendBillingEvent =>
  (event: BillingEvent) =>
    pipe(
      TE.tryCatch(() => client.createBatch(), E.toError),
      TE.chain((eventDataBatch) =>
        eventDataBatch.tryAdd({ body: event })
          ? TE.right(eventDataBatch)
          : TE.left(new Error("Unable to add new events to event hub batch!"))
      ),
      TE.chain((eventDataBatch) =>
        TE.tryCatch(() => client.sendBatch(eventDataBatch), E.toError)
      ),
      TE.map(() => event)
    );
