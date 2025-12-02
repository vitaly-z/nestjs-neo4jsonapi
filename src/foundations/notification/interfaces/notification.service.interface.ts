export interface NotificationServiceInterface {
  sendNotification(params: any): Promise<void>;
}
