"use client";

import { useForm, FormProvider } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Institution } from "@/lib/selfcare/api";

import { kebabCase } from "lodash";
import { useEffect } from "react";

import { CreateApiKeyPayload, createApiKeyPayloadSchema } from "@/lib/api-keys";

export type FormFields = CreateApiKeyPayload;

export default function CreateApiKeyForm({
  children,
  institution,
}: {
  children: React.ReactNode;
  institution: Institution;
}) {
  const methods = useForm<FormFields>({
    defaultValues: {
      environment: "test",
      displayName: "",
      cidrs: [],
      testers: [],
      institutionId: institution.id,
    },
    resolver: zodResolver(createApiKeyPayloadSchema),
  });

  const environment = methods.watch("environment", "test");

  useEffect(() => {
    const random = Math.random().toString(32).substring(3, 7);
    methods.setValue(
      "displayName",
      `${kebabCase(institution.name)}-${random}-${environment}`
    );
  }, [institution.name, environment]);

  const onSubmit = async (data: FormFields) => {
    const response = await fetch("/api/api-keys", {
      method: "POST",
      body: JSON.stringify({ ...data, environment: "TEST" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    console.log(json);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}
