import axios from 'axios'
import { authHeader } from './UserService'
import { API_HOST, PAGE_SIZE } from '../config/env'

export const createTimelineEntries = (speakerId, conferenceId, isStarted) => (
    axios.post(API_HOST + '/api/create-timeline-entries/' + encodeURIComponent(speakerId) + '/' + encodeURIComponent(conferenceId) + '/' + encodeURIComponent(isStarted)
        , null, { headers: authHeader() })
        .then(res => res.status)
)

export const deleteSpeakerEntries = (speakerId, conferenceId) => (
    axios.delete(API_HOST + '/api/delete-speaker-entry/' + encodeURIComponent(speakerId) + '/' + encodeURIComponent(conferenceId), { headers: authHeader() })
        .then(res => res.status)
)

export const deleteSubscriberEntry = (entryId) => (
    axios.delete(API_HOST + '/api/delete-subscriber-entry/' + encodeURIComponent(entryId), { headers: authHeader() })
        .then(res => res.status)
)

export const getEntries = (subscriberId, page) => (
    axios.get(API_HOST + `/api/get-timeline-entries/${encodeURIComponent(subscriberId)}/${page}/${PAGE_SIZE}`, { headers: authHeader() })
        .then(res => res.data)
)