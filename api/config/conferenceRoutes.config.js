export default {
    create: '/api/create-conference',
    update: '/api/update-conference/:conferenceId',
    addMember: '/api/add-member/:conferenceId/:userId',
    removeMember: '/api/remove-member/:conferenceId/:userId',
    delete: '/api/delete-conference/:conferenceId',
    getConference: '/api/get-conference/:conferenceId',
    getConferences: '/api/get-conferences/:userId/:isPrivate/:page/:pageSize',
    getMembers:  '/api/get-members/:conferenceId',
    close:  '/api/close-conference/:userId/:conferenceId'
}