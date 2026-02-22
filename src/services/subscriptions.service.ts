import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string;
  priceRub: number;
  currency: string;
  interval: "MONTH" | "YEAR";
  intervalCount: number;
}

export interface CreateSubscriptionPaymentResponse {
  paymentId: string;
  confirmationUrl: string | null;
}

export interface SubscriptionPaymentStatusResponse {
  id: string;
  status: "PENDING" | "SUCCEEDED" | "CANCELLED" | "REFUNDED";
  providerPaymentId?: string | null;
}

export const subscriptionsService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    return apiClient.get<SubscriptionPlan[]>(API_ENDPOINTS.subscriptions.plans);
  },

  async createPayment(code: string): Promise<CreateSubscriptionPaymentResponse> {
    return apiClient.post<CreateSubscriptionPaymentResponse>(
      API_ENDPOINTS.subscriptions.createPayment,
      { code }
    );
  },

  async getPaymentStatus(paymentId: string): Promise<SubscriptionPaymentStatusResponse> {
    return apiClient.get<SubscriptionPaymentStatusResponse>(
      API_ENDPOINTS.subscriptions.paymentStatus(paymentId)
    );
  },
};
