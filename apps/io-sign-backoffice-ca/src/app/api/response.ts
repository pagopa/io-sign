import { NextResponse } from "next/server";
import {
  HttpBadRequestError,
  HttpConflictError,
  HttpError,
} from "@/infra/http/error";

const getResponseFromError = (e: HttpError) => {
  const { error, status } = e;
  return NextResponse.json({ error }, { status });
};

export const getCreatedResponse = (body: unknown) =>
  NextResponse.json(body, { status: 201 });

export const getErrorResponse = (e: Error) => {
  switch (e.name) {
    case "ParseError":
      return getResponseFromError(new HttpBadRequestError());
    case "ApiKeyAlreadyExistsError":
      return getResponseFromError(new HttpConflictError());
    default:
      return getResponseFromError(new HttpError());
  }
};
