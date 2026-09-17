export interface NotifyPayload {
  userId: string
  type: string
  title: string
  message: string
  relatedType?: string
  relatedId?: string
}
