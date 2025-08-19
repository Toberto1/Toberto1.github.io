

import * as util from './utils.js';
import * as global from './globals.js';
import * as dom from './domElements.js';

// js/api.js
const IP = global.API_IP;

const resultsBody = document.getElementById('searchResults');
const resultsBodylog = document.getElementById('log-list');
let editingLockout = false; // Prevent multiple edits at once

let selectedAccountForEdit = null;


// Function to get account details by name
export async function searchAccount(value, searchMethod, filter) {
    const myCallId = util.isLoading("searchResultsTable", true);

    try {
        const res = await fetch(`${IP}/api/users/searchUser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${global.getToken()}`
            },
            body: JSON.stringify({
                value: value.trim(),
                searchMethod,
                filter
            })
        });

        if (res.status === 401) {
            util.kick(); // token invalid or expired
            return null;
        }

        return await res.json();

    } catch (err) {
        console.error('Error:', err);
        return null;
    } finally {
        util.isLoading("searchResultsTable", false, myCallId);
    }
}


export async function getAccountById(userId) {
    try {
        const res = await fetch(`${IP}/api/users/getAccountById`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${global.getToken()}`
            },
            body: JSON.stringify({ userId })
        });
        if (res.status === 401) {
            util.kick(); // token invalid or expired
            return null;
        }
        const data = await res.json();
        return data;

    } catch (err) {
        console.error('Error:', err);
        return null;
    }
}


// Function to create a list of passes for an account upon search
export function createPassList(account) {

    const passes = {
        "opengympasses": account.opengympasses,
        "classpasses": account.classpasses,
        "privatekidpasses": account.privatekidpasses,
        "privateadultpasses": account.privateadultpasses,
        "aerialsilkspasses": account.aerialsilkspasses
    };

    const container = document.createElement('div');
    container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.alignItems = 'start'; container.style.gap = '10px';

    for (const key in passes) {
        if (passes.hasOwnProperty(key) && passes[key] > 0) {
            const flex = document.createElement('div');
            flex.style.display = 'flex';
            flex.style.justifyContent = 'center';
            flex.style.alignItems = 'center';
            flex.id = `${account.id}-${key}`;
            container.appendChild(flex);

            const passType = document.createElement('div');
            passType.classList.add('badge');
            passType.classList.add(key + '-color');

            let passName = util.passDBToReadable(key);

            passType.textContent = passes[key] + '\t' + passName;

            const useButton = document.createElement('input');
            useButton.type = 'button';
            useButton.classList.add('badge-button');
            useButton.value = 'USE';
            useButton.id = `use-${account.id}-${key}`;

            // Add event listener for the use button
            useButton.addEventListener('click', () => {
                if (editingLockout) return;

                usePass(account.id, key)
                    .then(response => {
                        if (response && response.success) {
                            loadSearchTableResults().then(() => {
                                util.whiteFlash(flex.id); // Flash the flex container to make it visually clear something happened
                                editLock(1000);
                            });

                        }
                    });
            });
            flex.appendChild(passType);
            flex.appendChild(useButton);
        }
    }
    return container; // caller can append this container to DOM when loading the search results
}

// Function to create a list of memberships for an account upon search
export function createMembershipList(account) {
    const memberships = account.memberships || [];
    const container = document.createElement('div');
    container.style.display = 'flex'; container.style.flexDirection = 'column'; container.style.alignItems = 'start'; container.style.gap = '10px';

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    let hasAnActiveMembership = false; //If this is true then it will not display any expired memberships
    let alreadyShownLatestExpired = false;

    for (const membership of memberships) {
        const isExpired = membership.end_date && util.isExpired(membership.end_date);
        if (hasAnActiveMembership && isExpired || alreadyShownLatestExpired && isExpired) continue;
        if (membership.is_closed) continue;

        const membershipDiv = document.createElement('div');
        membershipDiv.style.display = 'flex';

        const membershipBadge = document.createElement('div');
        membershipBadge.classList.add('membership-badge');
        membershipBadge.classList.add(membership.type + '-color');

        let membershipName = '';
        switch (membership.type) {
            case 'open': membershipName = 'Open Gym'; break;
            case 'class': membershipName = 'Classes'; break;
            case 'athletic': membershipName = 'Athletic'; break;
        }
        membershipBadge.innerHTML = `${membershipName}`;

        const membershipDesc = document.createElement('span');
        const noStartDate = (membership.start_date === null);
        const hasNotStarted = membership.start_date && new Date(membership.start_date) > new Date(todayDate);

        let daysLeftTxt = ''; //Extra info text

        let status = 0;
        if (noStartDate) status = 1;
        if (membership.is_unlimited) status = 2;
        if (membership.is_paused) status = 3;
        if (hasNotStarted) status = 4;
        if (isExpired) status = 5;

        switch (status) {
            case 0: daysLeftTxt = util.daysBetweenISO(todayDate, membership.end_date) + " days left"; break;
            case 1: {
                membershipBadge.classList.add('paused-color');
                const options = { year: "numeric", month: "short", day: "numeric" };
                daysLeftTxt = `No Start date yet (${membership.base_length} days)`;
            } break;
            case 2: daysLeftTxt = "Unlimited"; break;
            case 3: {
                membershipBadge.classList.add('paused-color');
                daysLeftTxt = "Paused";
            } break;
            case 4: {
                membershipBadge.classList.add('expired-color');
                const options = { year: "numeric", month: "short", day: "numeric" };
                daysLeftTxt = `Not Active Yet (Starts ${new Date(membership.start_date).toLocaleDateString("en-US", options)})`;
            } break;
            case 5: {
                membershipBadge.classList.add('expired-color');
                const options = { year: "numeric", month: "short", day: "numeric" };
                daysLeftTxt = 'Expired' + ` on ${new Date(membership.end_date).toLocaleDateString("en-US", options)}`;
            } break;
            default: daysLeftTxt = '';
        }

        membershipDesc.textContent = daysLeftTxt;
        membershipDesc.style.marginLeft = '10px';
        membershipDesc.style.fontStyle = 'italic';
        membershipDesc.style.padding = '6px 0';

        membershipDiv.appendChild(membershipBadge);
        membershipDiv.appendChild(membershipDesc);
        container.appendChild(membershipDiv);

        if (!isExpired) hasAnActiveMembership = true;
        else alreadyShownLatestExpired = true;
    };

    return container;
}

function usePass(userId, passType) {

    return fetch(`${IP}/api/users/usePass`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, passType })
    })
        .then(res => res.json())
        .catch(err => {
            console.error('Error using pass:', err);
            return null;
        });

}

export async function loadSearchTableResults() {

    util.whiteFlash("searchAccount-container");
    dom.swapTab(global.tabIndexs.search); //search tab

    const searchTerm = document.getElementById("searchInput").value.trim();
    const searchMethod = global.getSearchMethod();

    const filter = {
        open: document.getElementById("open-gym-filter").checked,
        class: document.getElementById("classes-filter").checked,
        athletic: document.getElementById("athletic-filter").checked,
    }
    const atLeastOneFilter = (filter.open || filter.class || filter.athletic)

    const defaultSearchResultTxt = '<tr><td colspan="4" class="tooltipText" style="vertical-align: top;">Use the search box at the top to find an account</td></tr>';
    resultsBody.innerHTML = defaultSearchResultTxt;

    if (searchTerm.length === 0 && !atLeastOneFilter) return;

    const results = await searchAccount(searchTerm, searchMethod, filter);

    if (results && results.length > 0) {
        resultsBody.innerHTML = '';
        results.forEach(account => {
            const row = document.createElement('tr');

            const nameCol = document.createElement('td');
            nameCol.textContent = account[global.getSearchMethod()];

            const membershipsCol = document.createElement('td');
            membershipsCol.appendChild(createMembershipList(account));

            const passesCol = document.createElement('td');
            passesCol.appendChild(createPassList(account));

            const notesCol = document.createElement('td');
            notesCol.textContent = account.notes;
            notesCol.style.fontStyle = 'italic';
            notesCol.style.color = '#555';

            const editCol = document.createElement('td');

            const editButton = document.createElement('input');
            editButton.type = 'button'; editButton.value = 'Edit';
            editButton.classList.add('edit-button');

            editButton.addEventListener('click', () => {
                // Handle edit action
                console.log(`Editing account: ${account.name}`);
                global.setSelectedAccountForEdit(account);
                console.log(account);

                dom.swapTab(global.tabIndexs.editAccount);
                util.whiteFlash("editAccount-container");
            });

            const logButton = document.createElement('input');
            logButton.type = 'button'; logButton.value = 'Logs';
            logButton.classList.add('edit-button');
            logButton.style.marginRight = "5px";

            logButton.addEventListener('click', () => {
                global.setSelectedAccountForLog(account);
                util.applyPreset('alltime');
                dom.swapTab(global.tabIndexs.logHistory);

                util.toggleElement("selectedAccountInfoButton");

                const container = document.getElementById("selectedAccountInfo-container");
                const name = document.createElement("p"); name.textContent = account.name;
                const email = document.createElement("p"); email.textContent = account.email;
                const phone = document.createElement("p"); phone.textContent = account.phone_number;

                container.appendChild(name);
                container.appendChild(email);
                container.appendChild(phone);

                const removeBtn = document.createElement("input");
                removeBtn.classList.add("action-btn", "cancel-btn"); removeBtn.value = "Clear Account Filter"; removeBtn.type = "button";
                removeBtn.addEventListener("click", () => {
                    global.setSelectedAccountForLog(null);
                    util.applyPreset('today');
                    loadLogResults();
                    util.whiteFlash("log-container");
                    util.toggleElement("selectedAccountInfoButton");

                    container.removeChild(name);
                    container.removeChild(email);
                    container.removeChild(phone);
                    container.removeChild(removeBtn);
                });
                container.appendChild(removeBtn);

                loadLogResults();
                util.whiteFlash("log-container");
            });

            editCol.appendChild(logButton);
            editCol.appendChild(editButton);

            row.appendChild(nameCol);
            row.appendChild(membershipsCol);
            row.appendChild(passesCol);
            row.appendChild(notesCol);
            row.appendChild(editCol);

            resultsBody.appendChild(row);
        });

    } else resultsBody.innerHTML = '<tr><td colspan="4" class="tooltipText" style="vertical-align: top;">No Results Found</td></tr>';

}

export async function loadLogResults() {
    util.whiteFlash("log-container");
    dom.toggleLogFilterRow(false)

    const startDateInput = document.getElementById("log-start-date");
    const endDateInput = document.getElementById("log-end-date");
    const actionTypeInput = document.getElementById("log-action-type");
    const limit = document.getElementById("log-row-limit");

    const startDateValue = startDateInput.value;
    const endDateValue = endDateInput.value;
    const actionType = actionTypeInput.value;
    const limitValue = limit.value;

    if (!startDateValue || !endDateValue) return;

    const limitNum = parseInt(limitValue);
    if (isNaN(limitNum) || limitNum <= 0) return;

    const startTime = `${startDateValue} 00:00:00`;
    const endTime = `${endDateValue} 23:59:59.999`;

    const accountId = (global.getselectedAccountForLog() === null) ? null : global.getselectedAccountForLog().id;
    const results = await fetchLogs(startTime, endTime, actionType, limitNum, parseInt(accountId));

    resultsBodylog.innerHTML = ''; // clear old results

    if (results && results.length > 0) {
        // Group logs by "timestamp + personKey"
        const groupedLogs = {};

        for (let i = 0; i < results.length; i++) {
            const log = results[i];

            // Normalize person key - lowercase and trim if string
            const personKeyRaw = log.name || log.email || log.phone_number || "unknown";
            const personKey = typeof personKeyRaw === 'string' ? personKeyRaw.trim().toLowerCase() : "unknown";

            // Parse timestamp and truncate milliseconds to zero
            const dateObj = new Date(log.timestamp);
            dateObj.setMilliseconds(0); // zero out milliseconds
            dateObj.setSeconds(0);

            // Create ISO string without milliseconds
            const logTimeISO = dateObj.toISOString();

            const groupKey = `${logTimeISO}__${personKey}`;

            if (!groupedLogs[groupKey]) groupedLogs[groupKey] = [];
            groupedLogs[groupKey].push(log);
        }


        // For each group, create one header + multiple bodies
        for (const groupKey in groupedLogs) {
            const logsGroup = groupedLogs[groupKey];

            // Create header from first log in group
            const firstLog = logsGroup[0];

            const row = document.createElement('div');
            row.classList.add("log-entry");

            const head = document.createElement('div');
            head.classList.add("log-entry-head");

            const dateObj = new Date(firstLog.timestamp);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            };
            const formattedDate = dateObj.toLocaleString('en-US', options);

            // Timestamp div
            const timestampDiv = document.createElement('div');
            timestampDiv.textContent = `[${formattedDate}] `;
            timestampDiv.style.fontWeight = "bold";

            // Name div
            const nameDiv = document.createElement('div');
            const hasName = !!firstLog.name;
            nameDiv.textContent = hasName ? firstLog.name : 'Unknown User';
            nameDiv.style.color = hasName ? '#0066cc' : '#999999';
            nameDiv.style.cursor = hasName ? 'pointer' : 'default';
            nameDiv.style.fontWeight = hasName ? 'bold' : 'normal';
            if (hasName) {
                nameDiv.addEventListener('click', () => {
                    dom.swapTab(global.tabIndexs.search);
                    global.setSearchMethod("name");
                    document.getElementById("filter-name").checked = true;
                    document.getElementById("searchMethodTableHead").innerHTML = "Name";
                    document.getElementById("searchInput").value = firstLog.name;
                    loadSearchTableResults();
                });
            }

            // Email div
            const emailDiv = document.createElement('div');
            const hasEmail = !!firstLog.email;
            emailDiv.textContent = hasEmail ? firstLog.email : 'unknown email';
            emailDiv.style.color = hasEmail ? '#0066cc' : '#999999';
            emailDiv.style.cursor = hasEmail ? 'pointer' : 'default';
            emailDiv.style.fontWeight = hasEmail ? 'bold' : 'normal';
            if (hasEmail) {
                emailDiv.addEventListener('click', () => {
                    dom.swapTab(global.tabIndexs.search);
                    global.setSearchMethod("email");
                    document.getElementById("filter-email").checked = true;
                    document.getElementById("searchInput").value = firstLog.email;
                    document.getElementById("searchMethodTableHead").innerHTML = "Email";
                    loadSearchTableResults();
                });
            }

            // Phone div
            const phoneDiv = document.createElement('div');
            const hasPhone = !!firstLog.phone_number;
            phoneDiv.textContent = hasPhone ? firstLog.phone_number : 'unknown phone';
            phoneDiv.style.color = hasPhone ? '#0066cc' : '#999999';
            phoneDiv.style.cursor = hasPhone ? 'pointer' : 'default';
            phoneDiv.style.fontWeight = hasPhone ? 'bold' : 'normal';
            if (hasPhone) {
                phoneDiv.addEventListener('click', () => {
                    dom.swapTab(global.tabIndexs.search);
                    global.setSearchMethod("phone_number");
                    document.getElementById("filter-number").checked = true;
                    document.getElementById("searchInput").value = firstLog.phone_number;
                    document.getElementById("searchMethodTableHead").innerHTML = "Phone";
                    loadSearchTableResults();
                });
            }

            head.appendChild(timestampDiv);
            head.appendChild(nameDiv);
            head.appendChild(emailDiv);
            head.appendChild(phoneDiv);

            row.appendChild(head);

            // Append each log's body info inside this group
            for (const log of logsGroup) {
                const body = document.createElement('div');
                body.classList.add("log-entry-subrow");

                const action = global.logActions[log.action];

                const changeDiv = document.createElement('label');
                changeDiv.classList.add("oldToNewSticker");
                const oldValNum = parseFloat(log.old_value);
                const newValNum = parseFloat(log.new_value);

                if (!isNaN(oldValNum) && !isNaN(newValNum)) {
                    if (oldValNum < newValNum)
                        changeDiv.classList.add("additive-update");
                    else if (oldValNum > newValNum)
                        changeDiv.classList.add("subtractive-update");
                }
                if (log.old_value === '') log.old_value = '" "';
                if (log.new_value === '') log.new_value = '" "';
                changeDiv.textContent = `${log.old_value} → ${log.new_value}`;

                const fieldDiv = document.createElement('label');
                fieldDiv.style.width = "10%";
                fieldDiv.classList.add("sticker");

                if (util.passDBToReadable(log.field) !== '') {
                    fieldDiv.textContent = util.passDBToReadable(log.field);
                    fieldDiv.classList.add(`${log.field}-color`);
                } else {
                    fieldDiv.textContent = log.field;
                }

                const actionDiv = document.createElement('div');
                actionDiv.textContent = action;

                body.appendChild(actionDiv);

                if (![global.logActions.ACCOUNT_ADDED, global.logActions.MEMBERSHIP_ADDED].includes(action)) {
                    body.appendChild(fieldDiv);
                    body.appendChild(changeDiv);
                }

                row.appendChild(body);
            }

            resultsBodylog.appendChild(row);
        }
    } else {
        resultsBodylog.innerHTML = '<div style="padding: 1.5em; font-size: 14px;">No results found</div>';
    }

    function formatReadableDate(dateStr) {
        const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return localDate.toLocaleDateString(undefined, options);
    }

    const formattedStart = formatReadableDate(startDateValue);
    const formattedEnd = formatReadableDate(endDateValue);

    const resultDate = (startDateValue === endDateValue)
        ? formattedStart
        : `${formattedStart} to ${formattedEnd}`;
    const logResultText = document.getElementById("log-result-text");
    const selectedOptionText = actionTypeInput.querySelector(`option[value="${actionTypeInput.value}"]`)?.textContent;
    logResultText.innerHTML = `Showing results from <strong>${resultDate}</strong> for <strong>${selectedOptionText}</strong> actions`;

    if (global.getselectedAccountForLog() !== null)
        logResultText.innerHTML += ` (History for <strong> ${global.getselectedAccountForLog().name}</strong>) `;

    logResultText.innerHTML += ` <span style="color: #666; font-style: italic;"> (${results.length})</span>`;
}


export async function fetchLogs(startTime, endTime, actionType, limit, accountId) {
    const myCallId = util.isLoading("log-container", true);
    try {
        const res = await fetch(`${IP}/api/logs/fetchLog`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${global.getToken()}`
            },
            body: JSON.stringify({
                startTime,
                endTime,
                actionType,
                limit,
                accountId
            })
        });
        if (res.status === 401) {
            util.kick(); // token invalid or expired
            return null;
        }
        const data = await res.json();

        return data;

    } catch (err) {
        console.error('Error:', err);
        return null;
    } finally {
        util.isLoading("log-container", false, myCallId);
    }
}

window.loadLogResults = loadLogResults;


function editLock(lockoutTime) {
    if (editingLockout) return; // Prevent multiple edits at once
    editingLockout = true;

    document.querySelectorAll('input[type="button"]').forEach(button => {
        button.classList.add('editLockout');
    });

    setTimeout(() => {
        editingLockout = false; // Release lock after operation
        document.querySelectorAll('input[type="button"]').forEach(button => {
            button.classList.remove('editLockout');
        });
    }, lockoutTime);
}







