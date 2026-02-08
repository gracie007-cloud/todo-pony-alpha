"use client";

import * as React from "react";
import { AppLayout } from "@/components/layout";
import { SWRConfig } from "swr";

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
      }}
    >
      <AppLayout>{children}</AppLayout>
    </SWRConfig>
  );
}
