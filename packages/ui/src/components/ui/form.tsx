// SPDX-License-Identifier: AGPL-3.0-only
// coss ui © Cal.com, Inc. — https://coss.com/ui · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Form as FormPrimitive } from "@base-ui/react/form";
import type React from "react";

export function Form({
  className,
  ...props
}: FormPrimitive.Props): React.ReactElement {
  return <FormPrimitive className={className} data-slot="form" {...props} />;
}

export { FormPrimitive };
