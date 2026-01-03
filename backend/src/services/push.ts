import webPush from 'web-push';
import { supabaseAdmin } from '../config/supabase';

export class PushNotificationService {
  constructor() {
    this.initializeVapid();
  }

  /**
   * Initialize VAPID keys for web push
   * In production, these should be stored in environment variables
   */
  private initializeVapid() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@ug-campaign-tracker.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('⚠️  VAPID keys not found in environment variables.');
      console.warn('Generate keys by running: npx web-push generate-vapid-keys');
      console.warn('Then add them to your .env file:');
      console.warn('VAPID_PUBLIC_KEY=...');
      console.warn('VAPID_PRIVATE_KEY=...');
      return;
    }

    webPush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    console.log('✅ Web Push VAPID configured');
  }

  /**
   * Save a push subscription to the database
   * @param userId - User ID from Supabase Auth
   * @param subscription - Push subscription object from browser
   */
  async saveSubscription(userId: string, subscription: any) {
    try {
      // Check if subscription already exists
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('endpoint', subscription.endpoint)
        .single();

      if (existing) {
        console.log('Subscription already exists for user:', userId);
        return { success: true, message: 'Subscription already registered' };
      }

      // Insert new subscription
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys, // { auth, p256dh }
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Subscription saved for user:', userId);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to save subscription:', error);
      throw error;
    }
  }

  /**
   * Remove a push subscription from the database
   * @param userId - User ID
   * @param endpoint - Push subscription endpoint
   */
  async removeSubscription(userId: string, endpoint: string) {
    try {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;

      console.log('✅ Subscription removed for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove subscription:', error);
      throw error;
    }
  }

  /**
   * Send a push notification to a specific subscription
   * @param subscription - Subscription object with endpoint and keys
   * @param payload - Notification payload
   */
  async sendNotification(subscription: any, payload: { title: string; body: string; data?: any }) {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      });

      await webPush.sendNotification(pushSubscription, notificationPayload);
      console.log('✅ Push notification sent to:', subscription.endpoint);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to send push notification:', error);

      // If subscription is invalid (410 Gone, 404 Not Found), remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('🗑️  Removing invalid subscription:', subscription.endpoint);
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      throw error;
    }
  }

  /**
   * Send push notification to all subscribed users
   * @param payload - Notification payload
   * @param userIds - Optional: specific user IDs to notify
   */
  async sendToUsers(payload: { title: string; body: string; data?: any }, userIds?: string[]) {
    try {
      let query = supabaseAdmin
        .from('subscriptions')
        .select('*');

      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data: subscriptions, error } = await query;

      if (error) throw error;

      if (!subscriptions || subscriptions.length === 0) {
        console.log('No subscriptions found');
        return { success: true, sent: 0 };
      }

      console.log(`📤 Sending notifications to ${subscriptions.length} subscriptions...`);

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Sent ${successful} notifications (${failed} failed)`);

      return { success: true, sent: successful, failed };
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Notify users about a new rally in their subscribed district/candidate
   * @param rallyId - Rally ID
   */
  async notifyRallyAlert(rallyId: string) {
    try {
      // Fetch rally details with candidate and district
      const { data: rally, error } = await supabaseAdmin
        .from('rallies')
        .select('*, candidate:candidates(name), district:districts(name)')
        .eq('id', rallyId)
        .single();

      if (error || !rally) {
        console.error('Rally not found:', rallyId);
        return;
      }

      // For now, send to all users (in production, filter by preferences)
      const payload = {
        title: `New Rally Alert: ${rally.candidate?.name || 'Candidate'}`,
        body: `${rally.title} at ${rally.venue_name} on ${new Date(rally.start_time).toLocaleDateString()}`,
        data: {
          rallyId: rally.id,
          url: `/rallies/${rally.id}`, // Deep link to rally details
        },
      };

      await this.sendToUsers(payload);

      console.log('✅ Rally alert sent for:', rally.title);
    } catch (error) {
      console.error('Failed to send rally alert:', error);
    }
  }

  /**
   * Test notification - send to a specific user
   * @param userId - User ID to send test notification
   */
  async sendTestNotification(userId: string) {
    const payload = {
      title: '🎉 Welcome to UG Campaign Tracker!',
      body: 'You will receive rally alerts and traffic updates here.',
      data: { test: true },
    };

    await this.sendToUsers(payload, [userId]);
  }
}
