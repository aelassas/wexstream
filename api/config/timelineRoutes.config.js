export default {
    create: '/api/create-timeline-entries/:speakerId/:conferenceId/:isStarted',
    deleteSpeakerEntries: '/api/delete-speaker-entry/:speakerId/:conferenceId',
    deleteSubscriberEntry: '/api/delete-subscriber-entry/:entryId',
    getEntries: '/api/get-timeline-entries/:subscriberId/:page/:pageSize'
};