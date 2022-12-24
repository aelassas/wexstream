export default {
    connect: '/api/connect',
    get: '/api/get-connection/:userId/:connectionId',
    getConnectionIds: '/api/get-connection-ids/:userId/:connectionId',
    delete: '/api/delete-connection/:userId/:connectionId',
    getConnection: '/api/connection/:connectionId',
    getConnections: '/api/connections/:userId/:page/:pageSize'
}