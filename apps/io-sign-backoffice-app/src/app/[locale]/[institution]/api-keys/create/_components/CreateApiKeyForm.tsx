"use client";

import { useForm, FormProvider } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";
import { Institution } from "@/lib/selfcare/api";

import { kebabCase } from "lodash";
import { useEffect } from "react";

const FormFields = z.object({
  environment: z.union([z.literal("test"), z.literal("prod")]),
  displayName: z.string().min(3).max(20),
  cidrs: z.array(z.string()),
});

export type FormFields = z.infer<typeof FormFields>;

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
      cidrs: [] as string[],
    },
    resolver: zodResolver(FormFields),
  });

  const environment = methods.watch("environment", "test");

  useEffect(() => {
    const random = Math.random().toString(32).substring(3, 7);
    methods.setValue(
      "displayName",
      `${kebabCase(institution.name)}-${random}-${environment}`
    );
  }, [institution.name, environment]);

  const onSubmit = (data: {}) => console.log(data);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>{children}</form>
    </FormProvider>
  );
}
