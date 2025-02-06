import { proxyActivities } from '@temporalio/workflow';
import type { ITokenValidationActivity } from '../interfaces/auth.interface';

const { validateToken } = proxyActivities<ITokenValidationActivity>({
  startToCloseTimeout: '30 seconds',
});

/** Workflow that validates a token and returns user information */
export async function validateTokenWorkflow(token: string) {
  return await validateToken(token);
}
