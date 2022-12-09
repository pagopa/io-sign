import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

export const mockPublicKey =
  "-----BEGIN PUBLIC KEY-----\nMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAERhfFBG49rxi/jYM0pxeN833dEIJx7chs\nFD8Gne/I9Y61yRvUN1k3Tv3DoTJcWdQeHRBU5dE6lcqH5P5wVTlNIA==\n-----END PUBLIC KEY-----\n" as NonEmptyString;

export const mockSignature =
  "MEUCIQDl1JDRRzaJq+Gn1NMkq0j5ajX94faDjrVPC3BGqy069gIgbts4/L9tagID9uEstAk4Eqa7/3Gxzo6XMi62rVifoa8=" as NonEmptyString;

export const mockSignedTos =
  "MEUCIQCRLWJpkL+LVFC/cAlwDq8sBdGJUcyBq5HJtAHk+8fnBAIgS99/XVvDu6KSS9cazaoAkEMaUEvzrCtPrTvvslsxjQk=" as NonEmptyString;
