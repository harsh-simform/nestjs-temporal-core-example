import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import { TemporalService } from "nestjs-temporal-core";
import type { FulfillmentRequest } from "../workflows/fulfillment.workflow";

export interface StartFulfillmentWorkflowRequest {
  orderId: string;
  fulfillmentRequest: FulfillmentRequest;
}

export interface StartFulfillmentWorkflowResult {
  fulfillmentWorkflowId: string;
  started: boolean;
  error?: string;
}

export interface SignalFulfillmentRequest {
  fulfillmentWorkflowId: string;
  signalName: string;
  args: any[];
}

export interface WorkflowActivities {
  startFulfillmentWorkflow(
    request: StartFulfillmentWorkflowRequest
  ): Promise<StartFulfillmentWorkflowResult>;

  signalFulfillmentWorkflow(request: SignalFulfillmentRequest): Promise<void>;

  queryFulfillmentStatus(fulfillmentWorkflowId: string): Promise<any>;
}

@Injectable()
@Activity()
export class WorkflowActivityService implements WorkflowActivities {
  private readonly logger = new Logger(WorkflowActivityService.name);

  constructor(private readonly temporal: TemporalService) {}

  @ActivityMethod()
  async startFulfillmentWorkflow(
    request: StartFulfillmentWorkflowRequest
  ): Promise<StartFulfillmentWorkflowResult> {
    const fulfillmentWorkflowId = `fulfillment-${
      request.orderId
    }-${Date.now()}`;

    this.logger.log(
      `Starting independent fulfillment workflow: ${fulfillmentWorkflowId} for order ${request.orderId}`
    );

    try {
      // Start the fulfillment workflow as an independent workflow (not a child)
      await this.temporal.startWorkflow(
        "fulfillmentWorkflow",
        [request.orderId],
        {
          workflowId: fulfillmentWorkflowId,
          taskQueue: "order-processing",
        }
      );

      // Give it a moment to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Send the start signal with fulfillment data
      await this.temporal.signalWorkflow(
        fulfillmentWorkflowId,
        "startFulfillment",
        [request.fulfillmentRequest]
      );

      this.logger.log(
        `Fulfillment workflow ${fulfillmentWorkflowId} started and signaled successfully`
      );

      return {
        fulfillmentWorkflowId,
        started: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to start fulfillment workflow for order ${request.orderId}: ${error.message}`
      );

      return {
        fulfillmentWorkflowId,
        started: false,
        error: error.message,
      };
    }
  }

  @ActivityMethod()
  async signalFulfillmentWorkflow(
    request: SignalFulfillmentRequest
  ): Promise<void> {
    this.logger.log(
      `Sending signal ${request.signalName} to fulfillment workflow ${request.fulfillmentWorkflowId}`
    );

    try {
      await this.temporal.signalWorkflow(
        request.fulfillmentWorkflowId,
        request.signalName,
        request.args
      );

      this.logger.log(
        `Signal ${request.signalName} sent successfully to ${request.fulfillmentWorkflowId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send signal ${request.signalName} to fulfillment workflow ${request.fulfillmentWorkflowId}: ${error.message}`
      );
      throw error;
    }
  }

  @ActivityMethod()
  async queryFulfillmentStatus(fulfillmentWorkflowId: string): Promise<any> {
    this.logger.log(
      `Querying fulfillment status for workflow ${fulfillmentWorkflowId}`
    );

    try {
      const status = await this.temporal.queryWorkflow(
        fulfillmentWorkflowId,
        "getFulfillmentStatus"
      );

      return status;
    } catch (error) {
      this.logger.error(
        `Failed to query fulfillment status for workflow ${fulfillmentWorkflowId}: ${error.message}`
      );
      throw error;
    }
  }
}
