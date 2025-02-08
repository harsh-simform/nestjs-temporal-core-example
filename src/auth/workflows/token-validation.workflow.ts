import { proxyActivities } from "@temporalio/workflow";
import type { ITokenValidationActivity } from "../interfaces/auth.interface";

const { validateToken1, validateToken2 } =
  proxyActivities<ITokenValidationActivity>({
    startToCloseTimeout: "30 seconds",
  });

/** Workflow that validates a token and returns user information */
export async function validateTokenWorkflow1(token: string) {
  return await validateToken1(token);
}

export async function validateTokenWorkflow2(token: string) {
  return await validateToken2(token);
}
