let membershipRowCounter_add = 0;
let membershipRowCounter_edit = 0;

export function getMembershipCounter(type) {
    switch (type) {
        case "add": return membershipRowCounter_add;
        case "edit": return membershipRowCounter_edit;
    }
}
export function incramentMembershipCounter(type) {
    switch (type) {
        case "add": return membershipRowCounter_add++;
        case "edit": return membershipRowCounter_edit++;
    }
}

export function resetMembershipCounter(type) {
    switch (type) {
        case "add": membershipRowCounter_add = 0; break;
        case "edit": membershipRowCounter_edit = 0; break;
    }
}


let selectedAccountForEdit = null;

export function setSelectedAccountForEdit(account) {
    selectedAccountForEdit = account;
}

export function getselectedAccountForEdit() {
    return selectedAccountForEdit;
}

let selectedAccountForLog = null;

export function setSelectedAccountForLog(account) {
    selectedAccountForLog = account;
}

export function getselectedAccountForLog() {
    return selectedAccountForLog;
}

export const tabIndexs = {
    search: 0,
    upcoming: 1,
    addAccount: 2,
    editAccount: 3,
    logHistory: 4
};

export function getToken() {
    return localStorage.getItem('token');
}


let searchMethod = "name";
const validSearchMethods = ["name", "email", "phone_number"];

export function setSearchMethod(method) {
    if (validSearchMethods.includes(method)) {
        searchMethod = method;
    }
}

export function getSearchMethod() {
    return searchMethod;
}

export const logActions = {
    ACCOUNT_ADDED: 'Account added',

    NAME_UPDATED: 'Name updated',
    EMAIL_UPDATED: 'Email updated',
    PHONE_UPDATED: 'Phone number updated',

    PASS_AMOUNT_UPDATED: 'Pass amount updated',

    MEMBERSHIP_ADDED: 'Membership added',
    MEMBERSHIP_TYPE_UPDATED: 'Membership type updated',
    MEMBERSHIP_AGE_UPDATED: 'Membership age group updated',
    MEMBERSHIP_START_UPDATED: 'Membership start date updated',
    MEMBERSHIP_END_UPDATED: 'Membership end date updated',
    MEMBERSHIP_LENGTH_UPDATED: 'Membership length updated',
    MEMBERSHIP_PAUSE_UPDATED: 'Membership paused/resumed',
    MEMBERSHIP_CLOSE_UPDATED: 'Membership closed',

    NOTE_UPDATED: 'Note updated',

    MEMBERSHIP_UNLIMITED_UPDATED: 'Membership unlimted status',

    INIT_FIELD: 'Initial field setup',
};




export const API_IP = 'https://monkeyvault-backend-production.up.railway.app';