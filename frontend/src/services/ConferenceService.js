import axios from 'axios';
import { authHeader } from './UserService';
import { API_HOST, PAGE_SIZE } from '../config/env.config';

export const getConferenceId = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('c')) {
        return params.get('c');
    }
    return '';
};

export const createConference = (data) => (
    axios.post(API_HOST + '/api/create-conference', data, { headers: authHeader() })
        .then(res => {
            return { status: res.status, data: res.data };
        })
);

export const updateConference = (conferenceId, data) => (
    axios.post(API_HOST + '/api/update-conference/' + encodeURIComponent(conferenceId), data, { headers: authHeader() })
        .then(res => res.status)
);

export const addMember = (conferenceId, userId) => (
    axios.post(API_HOST + '/api/add-member/' + encodeURIComponent(conferenceId) + '/' + encodeURIComponent(userId), null, { headers: authHeader() })
        .then(res => res.status)
);

export const removeMember = (conferenceId, userId) => (
    axios.post(API_HOST + '/api/remove-member/' + encodeURIComponent(conferenceId) + '/' + encodeURIComponent(userId), null, { headers: authHeader() })
        .then(res => res.status)
);

export const deleteConference = (conferenceId) => (
    axios.delete(API_HOST + '/api/delete-conference/' + encodeURIComponent(conferenceId), { headers: authHeader() })
        .then(res => res.status)
);

export const getConference = (conferenceId) => (
    axios.get(API_HOST + '/api/get-conference/' + encodeURIComponent(conferenceId), { headers: authHeader() })
        .then(res => res.data)
);

export const getConferences = (userId, isPrivate, page) => (
    axios.get(API_HOST + `/api/get-conferences/${encodeURIComponent(userId)}/${isPrivate}/${page}/${PAGE_SIZE}`, { headers: authHeader() })
        .then(res => res.data)
);

export const getMembers = (conferenceId) => (
    axios.get(API_HOST + '/api/get-members/' + encodeURIComponent(conferenceId), { headers: authHeader() })
        .then(res => res.data)
);

export const closeConference = (userId, conferenceId) => (
    axios.post(API_HOST + '/api/close-conference/' + encodeURIComponent(userId) + '/' + encodeURIComponent(conferenceId), null, { headers: authHeader() })
        .then(res => res.status)
);