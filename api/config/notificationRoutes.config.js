export default {
    notify: '/api/notify',
    approve: '/api/approve/:notificationId',
    decline: '/api/decline/:notificationId',
    markAsRead: '/api/mark-notification-as-read/:notificationId',
    markAllAsRead: '/api/mark-notifications-as-read/:userId',
    markAsUnRead: '/api/mark-notification-as-unread/:notificationId',
    getNotifications: '/api/notifications/:userId/:page/:pageSize',
    getNotification: '/api/notification/:userId/:senderConnectionId/:approverConnectionId',
    delete: '/api/delete-notification/:notificationId',
    deleteAll: '/api/delete-notifications/:userId',
    notificationCounter: '/api/notification-counter/:userId'
};