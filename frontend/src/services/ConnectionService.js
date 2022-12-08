import axios from 'axios';
import { authHeader } from './UserService';
import { API_HOST, PAGE_SIZE } from '../config/env.config';

export const connect = (data) => (
    axios.post(API_HOST + '/api/connect', data, { headers: authHeader() })
        .then(res => res.data)
);

export const getConnection = (userId, connectionId) => (
    axios.get(API_HOST + '/api/get-connection/' + encodeURIComponent(userId) + '/' + encodeURIComponent(connectionId), { headers: authHeader() })
        .then(res => res.data)
);

export const getConnectionIds = (userId, connectionId) => (
    axios.get(API_HOST + '/api/get-connection-ids/' + encodeURIComponent(userId) + '/' + encodeURIComponent(connectionId), { headers: authHeader() })
        .then(res => res.data)
);

export const deleteConnection = (userId, connectionId) => (
    axios.delete(API_HOST + '/api/delete-connection/' + encodeURIComponent(userId) + '/' + encodeURIComponent(connectionId), { headers: authHeader() })
        .then(res => res.status)
);

export const getConnectionById = (connectionId) => (
    axios.get(API_HOST + '/api/connection/' + encodeURIComponent(connectionId), { headers: authHeader() })
        .then(res => res.data)
);

export const getConnections = (userId, page) => (
    axios.get(API_HOST + `/api/connections/${encodeURIComponent(userId)}/${page}/${PAGE_SIZE}`, { headers: authHeader() })
        .then(res => res.data)
);