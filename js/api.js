

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
    const myCallId = util.isLoading("searchAccount-container", true);

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
        util.isLoading("searchAccount-container", false, myCallId);
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


                            // Fetch the updated account from the server
                            fetch(global.API_IP + '/api/users/searchUserById', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${global.getToken()}`
                                },
                                body: JSON.stringify({ id: account.id })
                            })
                                .then(res => res.json())
                                .then(updatedAccount => {
                                    if (!updatedAccount) return;
                                    document.getElementById(`search-entry-${account.id}`).replaceWith(createSearchEntry(updatedAccount));
                                    util.whiteFlash(`search-entry-${account.id}`);
                                    util.lockout(document.getElementById(`search-entry-${account.id}`), 3000);
                                })
                                .catch(err => {
                                    console.error('Error fetching updated account:', err);
                                });

                            if (global.getselectedAccountForEdit() && global.getselectedAccountForEdit().id === account.id) {
                                global.setSelectedAccountForEdit(null);
                                dom.toggleEditTabButton();
                            }

                            editLock(3000);

                            util.showTopHeaderDialog(`1 ${util.passDBToReadable(key)} pass used successfully!`, { success: true, autoClose: true, duration: 3000 });
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
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.getToken()}`
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

    if (searchTerm.length === 0 && !atLeastOneFilter) { //Load upcoming checkin content

        const classes = await fetchUpcomingClasses();
        await loadClasses(classes.classes);
        await createUpcomingPassCheckinList();
        await createUpcomingMembershipCheckinList(classes.classes);

        document.getElementById("search-content").classList.add("hidden");
        document.getElementById("upcomingCheckins-content").classList.remove("hidden");
        dom.updateMainTitle("Upcoming Check-ins", { custom: true });

    } else {

        const results = await searchAccount(searchTerm, searchMethod, filter);

        if (results && results.length > 0) {
            resultsBody.innerHTML = '';
            results.forEach(account => {
                resultsBody.appendChild(createSearchEntry(account));
            });

        } else resultsBody.innerHTML = '<div class="no-results">No Results Found</div>';

        document.getElementById("search-content").classList.remove("hidden");
        document.getElementById("upcomingCheckins-content").classList.add("hidden");


    }

}

function createSearchEntry(account, { disablePassList, disableMembershipList, disableNotes, hideButtons } = {}) {
    const row = document.createElement('div');
    row.id = `search-entry-${account.id}`;
    row.classList.add("search-entry");

    // === Name Column ===
    const nameCol = document.createElement('div');
    nameCol.classList.add('clickable');
    nameCol.textContent = account[global.getSearchMethod()];
    nameCol.addEventListener('click', (e) => {
        util.copyToClipboard(account[global.getSearchMethod()]);
        util.showTopHeaderDialog(
            `Copied to clipboard: ${account[global.getSearchMethod()]}`,
            { success: true, autoClose: true, duration: 2000 }
        );
    });

    // === Memberships Column ===
    const membershipsCol = document.createElement('div');
    membershipsCol.appendChild(createMembershipList(account));

    // === Passes Column ===
    const passesCol = document.createElement('div');
    passesCol.appendChild(createPassList(account));

    // === Notes Column ===
    const notesCol = document.createElement('div');
    notesCol.textContent = account.notes || '';
    notesCol.style.fontStyle = 'italic';
    notesCol.style.color = '#555';

    // === Inline Buttons Column (used only when hideButtons is false) ===
    const editCol = document.createElement('div');
    editCol.style.display = "flex";

    // named action functions so we can re-use them for popup buttons
    function doEdit(e) {
        if (e) e.stopPropagation();
        if (typeof editingLockout !== 'undefined' && editingLockout) return;
        global.setSelectedAccountForEdit(account);
        dom.toggleEditTabButton();
        dom.swapTab(global.tabIndexs.editAccount);
        util.whiteFlash("editAccount-container");
        util.whiteFlash("editAccountTabLabel");
    }

    function doLogs(e) {
        if (e) e.stopPropagation();
        if (typeof editingLockout !== 'undefined' && editingLockout) return;
        global.setSelectedAccountForLog(account);
        util.applyPreset('alltime');
        dom.swapTab(global.tabIndexs.logHistory);

        const logContainer = document.getElementById("log-container");
        const oldShortcut = logContainer.querySelector(".edit-shortcut");
        if (oldShortcut) oldShortcut.remove();

        const clonedEditButton = document.createElement('input');
        clonedEditButton.type = 'button';
        clonedEditButton.value = `Edit ${account.name || account[global.getSearchMethod()]}`;
        clonedEditButton.id = `log-container-edit-shortcut`;
        clonedEditButton.classList.add('clear-btn', 'action-btn', 'edit-shortcut');
        clonedEditButton.addEventListener('click', doEdit);

        const rowBtnRow = document.getElementById("log-filter-btn-row");
        if (rowBtnRow) rowBtnRow.appendChild(clonedEditButton);
        const clearFilterBtn = document.getElementById("clearAccountFilterBtn");
        if (clearFilterBtn) clearFilterBtn.classList.remove("hidden");

        if (typeof util.toggleElement === 'function') util.toggleElement("selectedAccountInfoButton");
        if (typeof loadLogResults === 'function') loadLogResults();
        util.whiteFlash("log-container");
    }

    // create inline inputs and attach the named handlers
    const editButton = document.createElement('input');
    editButton.type = 'button';
    editButton.value = 'Edit';
    editButton.classList.add('search-entry-button');
    editButton.addEventListener('click', doEdit);

    const logButton = document.createElement('input');
    logButton.type = 'button';
    logButton.value = 'Logs';
    logButton.classList.add('search-entry-button');
    logButton.style.marginRight = "5px";
    logButton.addEventListener('click', doLogs);

    // Append inline buttons only when hideButtons is false
    if (!hideButtons) {
        editCol.appendChild(logButton);
        editCol.appendChild(editButton);
    } else {
        // Make row clickable to open popup; ignore clicks on interactive elements
        row.classList.add("popup-row");
        let popupTimer;

        row.addEventListener("mouseover", (e) => {
            // ignore if hovered on interactive element
            if (e.target.closest('input,button,a,select')) return;

            // start timer for popup
            popupTimer = setTimeout(() => {
                // Close any existing popups
                document.querySelectorAll('.search-entry-popup').forEach(p => p.remove());

                // Create popup
                const popup = document.createElement("div");
                popup.id = `search-entry-popup-${account.id}`;
                popup.classList.add("search-entry-popup");
                Object.assign(popup.style, {
                    position: "absolute",
                    padding: "8px",
                    borderRadius: "6px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                    border: "1px solid #aaa",
                    background: "#ddd",
                    zIndex: 2000,
                    display: "flex",
                    gap: "8px",
                });

                // Buttons
                const popupLogBtn = document.createElement('input');
                popupLogBtn.type = 'button';
                popupLogBtn.value = 'Logs';
                popupLogBtn.classList.add('search-entry-button');
                popupLogBtn.addEventListener('click', (ev) => { ev.stopPropagation(); doLogs(); removePopup(); });

                const popupEditBtn = document.createElement('input');
                popupEditBtn.type = 'button';
                popupEditBtn.value = 'Edit';
                popupEditBtn.classList.add('search-entry-button');
                popupEditBtn.addEventListener('click', (ev) => { ev.stopPropagation(); doEdit(); removePopup(); });

                popup.appendChild(popupLogBtn);
                popup.appendChild(popupEditBtn);
                document.body.appendChild(popup);

                // Position popup
                const rect = row.getBoundingClientRect();
                const left = Math.max(8, rect.left + window.scrollX);
                let top = rect.bottom + window.scrollY;
                const popupRect = popup.getBoundingClientRect();
                if ((top + popupRect.height) > (window.scrollY + window.innerHeight)) {
                    top = rect.top + window.scrollY - popupRect.height - 6;
                }
                popup.style.left = `${left}px`;
                popup.style.top = `${top}px`;

                // cleanup helpers
                function removePopup() {
                    if (popup && popup.parentNode) popup.parentNode.removeChild(popup);
                    document.removeEventListener('click', onDocClick);
                    window.removeEventListener('resize', removePopup);
                    window.removeEventListener('scroll', removePopup, true);
                    document.removeEventListener('keydown', onKeyDown);
                }

                function onDocClick(evt) {
                    if (!popup.contains(evt.target)) removePopup();
                }
                function onKeyDown(evt) {
                    if (evt.key === 'Escape') removePopup();
                }

                setTimeout(() => document.addEventListener('click', onDocClick));
                window.addEventListener('resize', removePopup);
                window.addEventListener('scroll', removePopup, true);
                document.addEventListener('keydown', onKeyDown);

            }, 500); // 300ms buffer
        });

        // Cancel popup if mouse leaves before timer
        row.addEventListener("mouseleave", () => {
            clearTimeout(popupTimer);
        });

    }

    // === Append columns in original order ===
    row.appendChild(nameCol);
    if (!disableMembershipList) row.appendChild(membershipsCol);
    if (!disablePassList) row.appendChild(passesCol);
    if (!disableNotes) row.appendChild(notesCol);
    if (!hideButtons) row.appendChild(editCol);

    return row;
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

    // startDateValue and endDateValue are strings like "2025-08-22"
    const startTime = new Date(`${startDateValue}T00:00:00`).toISOString();
    const endTime = new Date(`${endDateValue}T23:59:59.999`).toISOString();

    const accountId = global.getselectedAccountForLog() === null ? null : global.getselectedAccountForLog().id;

    const logs = await fetchLogs(
        startTime,
        endTime,
        actionType,
        limitNum,
        parseInt(accountId)
    );

    const results = groupPassEntries(logs);

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

            const timestamp = firstLog.timestamp;
            const dateObj = new Date(timestamp);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            };
            const formattedDate = dateObj.toLocaleString('en-US', options);

            // Timestamp div
            const timestampDiv = document.createElement('div');
            timestampDiv.textContent = formattedDate;
            timestampDiv.style.fontWeight = "bold";

            const nameDiv = document.createElement('div');
            const hasName = !!firstLog.name;
            const emailDiv = document.createElement('div');
            const hasEmail = !!firstLog.email;
            const phoneDiv = document.createElement('div');
            const hasPhone = !!firstLog.phone_number;

            if (global.getselectedAccountForLog() === null) {

                // Name div
                nameDiv.textContent = hasName ? firstLog.name : 'Unknown User';
                nameDiv.style.color = hasName ? '#0066cc' : '#999999';
                nameDiv.style.cursor = hasName ? 'pointer' : 'default';
                nameDiv.style.fontWeight = hasName ? 'bold' : 'normal';
                if (hasName) {
                    nameDiv.addEventListener('click', () => {
                        dom.swapTab(global.tabIndexs.search);
                        global.setSearchMethod("name");
                        document.getElementById("searchMethodSelect").value = "name";
                        document.getElementById("searchMethodTableHead").innerHTML = "Name";
                        document.getElementById("searchInput").value = firstLog.name;
                        loadSearchTableResults();
                    });
                }

                // Email div
                emailDiv.textContent = hasEmail ? firstLog.email : 'unknown email';
                emailDiv.style.color = hasEmail ? '#0066cc' : '#999999';
                emailDiv.style.cursor = hasEmail ? 'pointer' : 'default';
                emailDiv.style.fontWeight = hasEmail ? 'bold' : 'normal';
                if (hasEmail) {
                    emailDiv.addEventListener('click', () => {
                        dom.swapTab(global.tabIndexs.search);
                        global.setSearchMethod("email");
                        document.getElementById("searchMethodSelect").value = "email";
                        document.getElementById("searchInput").value = firstLog.email;
                        document.getElementById("searchMethodTableHead").innerHTML = "Email";
                        loadSearchTableResults();
                    });
                }

                // Phone div
                phoneDiv.textContent = hasPhone ? firstLog.phone_number : 'unknown phone';
                phoneDiv.style.color = hasPhone ? '#0066cc' : '#999999';
                phoneDiv.style.cursor = hasPhone ? 'pointer' : 'default';
                phoneDiv.style.fontWeight = hasPhone ? 'bold' : 'normal';
                if (hasPhone) {
                    phoneDiv.addEventListener('click', () => {
                        dom.swapTab(global.tabIndexs.search);
                        global.setSearchMethod("phone_number");
                        document.getElementById("searchMethodSelect").value = "phone_number";
                        document.getElementById("searchInput").value = firstLog.phone_number;
                        document.getElementById("searchMethodTableHead").innerHTML = "Phone";
                        loadSearchTableResults();
                    });
                }
            }

            head.appendChild(timestampDiv);
            if (global.getselectedAccountForLog() === null) {
                head.appendChild(nameDiv);
                if (hasEmail) head.appendChild(emailDiv);
                if (hasPhone) head.appendChild(phoneDiv);
            }


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
                if (log.old_value === "") log.old_value = '" "';
                if (log.new_value === "") log.new_value = '" "';

                switch (log.action) {
                    case "PASS_AMOUNT_UPDATED":
                        changeDiv.textContent = `${log.old_value} → ${log.new_value}`;
                        if (newValNum - oldValNum > 0) changeDiv.classList.add("additive-update");
                        else changeDiv.classList.add("subtractive-update");

                        break;
                    case "MEMBERSHIP_ADDED":
                        changeDiv.textContent = `+${log.new_value} days`;
                        changeDiv.classList.add("additive-update");
                        break;
                    case "MEMBERSHIP_END_UPDATED":
                    case "MEMBERSHIP_START_UPDATED":
                        if (log.old_value === null) log.old_value = 'No Date';
                        changeDiv.textContent = `${log.old_value} → ${log.new_value}`;
                        break;
                    default:
                        if (log.old_value !== null && log.new_value !== null) {
                            changeDiv.textContent = `${log.old_value} → ${log.new_value}`;

                        }
                        if (log.old_value === null && log.new_value !== null) changeDiv.textContent = `${log.new_value}`;
                }




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

                const doNotShowFieldList = [
                    global.logActions.ACCOUNT_ADDED,
                    global.logActions.MEMBERSHIP_ADDED,
                    global.logActions.MEMBERSHIP_END_UPDATED,
                    global.logActions.MEMBERSHIP_START_UPDATED,
                    global.logActions.MEMBERSHIP_PAUSE_UPDATED,
                    global.logActions.MEMBERSHIP_TYPE_UPDATED,
                    global.logActions.MEMBERSHIP_CLOSE_UPDATED,
                    global.logActions.MEMBERSHIP_AGE_UPDATED,
                    global.logActions.MEMBERSHIP_UNLIMITED_UPDATED,
                    global.logActions.MEMBERSHIP_LENGTH_UPDATED,
                    global.logActions.NOTE_UPDATED,

                    global.logActions.NAME_UPDATED,
                    global.logActions.EMAIL_UPDATED,
                    global.logActions.PHONE_UPDATED,
                ];
                if (!doNotShowFieldList.includes(action)) {
                    body.appendChild(fieldDiv);

                }

                body.appendChild(changeDiv);
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
    let html = `<p>Showing results from <strong>${resultDate}</strong> for <strong>${selectedOptionText}</strong> actions`;

    const selectedAccount = global.getselectedAccountForLog();
    if (selectedAccount !== null) {
        html += ` (History for <span id="log-container-search-shortcut"> ${selectedAccount.name}</span>)`;

    }

    html += ` <span style="color: #666; font-style: italic;">(${results.length})</span></p>`;

    logResultText.innerHTML = html;



    document.getElementById("log-container-search-shortcut")?.addEventListener("click", () => {
        dom.swapTab(global.tabIndexs.search);
        global.setSearchMethod("name");
        document.getElementById("searchMethodSelect").value = "name";
        document.getElementById("searchMethodTableHead").innerHTML = "Name";
        document.getElementById("searchInput").value = global.getselectedAccountForLog().name;
        loadSearchTableResults();
    });


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

export async function loadDailyCheckins(date) {

    const startTime = new Date(`${date}T00:00:00`).toISOString();
    const endTime = new Date(`${date}T23:59:59.999`).toISOString();

    const data = await fetchDailyCheckins(startTime, endTime);

    const container = document.getElementById("dailyCheckin-container");
    container.style.fontSize = "14px";

    const list = document.getElementById("dailyCheckin-list");
    list.innerHTML = ''; // clear old entries

    const entries = groupPassEntries(data);

    const infoDiv = document.getElementById("dailyCheckin-info");
    infoDiv.style.textAlign = "center";
    infoDiv.style.marginTop = "2em";
    infoDiv.style.color = "#666";
    infoDiv.innerHTML = ''; // clear old info
    if (entries.length > 0) {
        const totalCheckins = entries.length;
        infoDiv.innerHTML = `Total Check-ins - (${totalCheckins})`;
    }

    if (entries.length === 0) {
        const noData = document.createElement("div");
        noData.style.padding = "1.5em";
        noData.style.fontSize = "14px";
        noData.textContent = "No check-ins for this date.";
        list.appendChild(noData);
    } else {
        entries.forEach(entry => {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("dailyCheckin-entry");

            const nameDiv = document.createElement("div");
            nameDiv.textContent = entry.name;
            nameDiv.style.fontWeight = "bold";
            nameDiv.style.color = entry.name ? "#0066cc" : "#999999";
            nameDiv.style.cursor = entry.name ? "pointer" : "default";

            if (entry.name) {
                nameDiv.addEventListener("click", () => {
                    dom.swapTab(global.tabIndexs.search);
                    global.setSearchMethod("name");
                    document.getElementById("searchMethodSelect").value = "name";
                    document.getElementById("searchMethodTableHead").innerHTML = "Name";
                    document.getElementById("searchInput").value = entry.name;
                    loadSearchTableResults();
                });
            }

            const timeDiv = document.createElement("div");
            const timeObj = new Date(entry.timestamp);
            const options = { hour: 'numeric', minute: '2-digit', hour12: true };
            timeDiv.textContent = timeObj.toLocaleString("en-US", options);

            const actionDiv = document.createElement("div");
            actionDiv.textContent = global.logActions[entry.action];

            const fieldDiv = document.createElement("div");
            fieldDiv.textContent = util.passDBToReadable(entry.field);

            if (fieldDiv.textContent !== '') {
                fieldDiv.classList.add("sticker");

                if (util.passDBToReadable(entry.field) !== '') {
                    fieldDiv.textContent = util.passDBToReadable(entry.field);
                    fieldDiv.classList.add(`${entry.field}-color`);
                } else {
                    fieldDiv.textContent = entry.field;
                }
            }

            const valueDiv = document.createElement("div");
            if (entry.new_value !== null) valueDiv.classList.add("oldToNewSticker");
            valueDiv.textContent = "";

            switch (entry.action) {
                case "PASS_AMOUNT_UPDATED":
                    const diff = entry.new_value - entry.old_value;
                    valueDiv.textContent = `${diff > 0 ? "+" : ""}${diff}`;

                    if (diff > 0) valueDiv.classList.add("additive-update");
                    else valueDiv.classList.add("subtractive-update");

                    break;
                case "MEMBERSHIP_ADDED":
                    valueDiv.textContent = `+${entry.new_value} days`;
                    valueDiv.classList.add("additive-update");
                    break;
                default:
                    if (entry.old_value !== null && entry.new_value !== null) {
                        valueDiv.textContent = `${entry.old_value} → ${entry.new_value}`;
                    }
            }

            entryDiv.appendChild(timeDiv);
            entryDiv.appendChild(nameDiv);
            entryDiv.appendChild(actionDiv);
            entryDiv.appendChild(fieldDiv);
            entryDiv.appendChild(valueDiv);

            list.appendChild(entryDiv);
        });
    }
    util.whiteFlash("dailyCheckin-list");
}

function groupPassEntries(entries) {
    const mergedEntries = entries.slice();

    for (let i = mergedEntries.length - 2; i >= 0; i--) {
        const current = mergedEntries[i];
        const next = mergedEntries[i + 1];

        if (
            current.action === "PASS_AMOUNT_UPDATED" &&
            next.action === "PASS_AMOUNT_UPDATED" &&
            current.field === next.field &&
            current.name === next.name
        ) {
            const currentTime = new Date(current.timestamp);
            const nextTime = new Date(next.timestamp);

            // Compare up to the minute
            if (
                currentTime.getFullYear() === nextTime.getFullYear() &&
                currentTime.getMonth() === nextTime.getMonth() &&
                currentTime.getDate() === nextTime.getDate() &&
                currentTime.getHours() === nextTime.getHours() &&
                currentTime.getMinutes() === nextTime.getMinutes()
            ) {
                // Merge into next
                next.new_value = current.new_value;
                mergedEntries.splice(i, 1); // Remove current
                // no i++ needed because we're going backwards
            }
        }
    }

    return mergedEntries;
}
async function fetchUpcomingClasses() {
    const BUFFER_MINUTES = 15;
    const now = new Date();

    // Helper to format as "HH:MM:SS"
    const formatTime = (date) => {
        return date.toTimeString().split(" ")[0];
    };

    const center = new Date();
    //const center = new Date(2025, 8, 26, 18, 0, 0);

    // Start = current time - buffer
    const start = new Date(center.getTime() - BUFFER_MINUTES * 60 * 1000);
    // End = current time + buffer
    const end = new Date(center.getTime() + BUFFER_MINUTES * 60 * 1000);

    const start_time = formatTime(start);
    const end_time = formatTime(end);

    const response = await fetch(`${IP}/api/classes/fetchClasses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.getToken()}`
        },
        body: JSON.stringify({
            day: 1,
            startTime: start_time,
            endTime: end_time
        })
    });

    if (response.status === 401) {
        util.kick(); // token invalid or expired
        return null;
    }

    const data = await response.json();
    return data;
}

export async function loadClasses(classArray) {
    const row = document.getElementById("upcomingClassRow");
    row.innerHTML = '';
    row.appendChild(dom.createUpComingClassRow(classArray));
}

async function fetchUpcomingCheckins(day, startTime, endTime) {
    const response = await fetch(`${IP}/api/users/fetchUpcomingCheckins`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.getToken()}`
        },
        body: JSON.stringify({
            day,
            startTime,
            endTime
        })
    });

    if (response.status === 401) {
        util.kick(); // token invalid or expired
        return null;
    }

    const data = await response.json();
    return data;
}

async function createUpcomingPassCheckinList() {
    const container = document.getElementById("upcomingCheckinsList");
    container.innerHTML = '';

    const { start, end } = util.getTimeRangeUTC(15);

    const formatTime = (date) => date.toISOString().split("T")[1];

    const checkins = await fetchUpcomingCheckins(util.getCurrentDayOfTheWeekUTC(), formatTime(start), formatTime(end));

    checkins.forEach(checkin => {
        const entry = createSearchEntry(checkin);
        container.appendChild(entry);
    });

    if (checkins.length === 0)
        container.innerHTML = '<div class="no-results">No upcoming check-ins for passes</div>';


}

async function createUpcomingMembershipCheckinList(classes) {
    const container = document.getElementById("upcomingCheckinsTable");

    const kidsList = document.getElementById("upcoming-checkin-kids-list");
    const adultsList = document.getElementById("upcoming-checkin-adults-list");
    const teensList = document.getElementById("upcoming-checkin-teens-list");

    // Determine which age groups are in the provided class list
    const hasAthletic = classes.some(cls => cls.name === "Athletic");
    const hasNormal = classes.some(cls => cls.name !== "Athletic");

    const hasKids = classes.some(cls => cls.age_group.includes("Kid"));
    const hasTeens = classes.some(cls => cls.age_group.includes("Teen"));
    const hasAdults = classes.some(cls => cls.age_group.includes("Adult") || cls.age_group.includes("Women's"));

    // If there are no eligible classes at all
    if (!hasAthletic && !hasNormal) {
        const noClassesMessage = document.createElement("div");
        noClassesMessage.classList.add("no-results");
        noClassesMessage.textContent = "No eligible members for upcoming classes.";
        noClassesMessage.style.border = "none";

        if (!container.lastChild?.classList?.contains("no-results")) {
            container.appendChild(noClassesMessage);
        }

        kidsList.classList.add("hidden");
        adultsList.classList.add("hidden");
        teensList.classList.add("hidden");
        return;
    }

    // Apply visibility based on what classes exist
    kidsList.classList.toggle("hidden", !hasKids);
    teensList.classList.toggle("hidden", !hasTeens);
    adultsList.classList.toggle("hidden", !hasAdults);

    // Query members
    const filter = { open: false, class: hasNormal, athletic: hasAthletic };
    const results = await searchAccount("", "name", filter);

    // Clear lists and add headers
    kidsList.innerHTML = '<h3>Kids</h3>';
    teensList.innerHTML = '<h3>Teens</h3>';
    adultsList.innerHTML = '<h3>Adults</h3>';

    if (!results?.length) return;

    for (const account of results) {
        for (const membership of account.memberships) {
            if (membership.is_closed || util.isExpired(membership.end_date)) continue;

            if (membership.age_group === "kid" && hasKids) {
                kidsList.appendChild(createSearchEntry(account, { disablePassList: true, disableNotes: true, hideButtons: true }));
            }
            else if (membership.age_group === "teen" && hasTeens) {
                teensList.appendChild(createSearchEntry(account, { disablePassList: true, disableNotes: true, hideButtons: true }));
            }
            else if (membership.age_group === "adult" && hasAdults) {
                adultsList.appendChild(createSearchEntry(account, { disablePassList: true, disableNotes: true, hideButtons: true }));
            }
        }
    }
}


async function fetchDailyCheckins(startTime, endTime) {
    const response = await fetch(`${IP}/api/logs/fetchDailyCheckins`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${global.getToken()}`
        },
        body: JSON.stringify({ startTime, endTime })
    });

    if (response.status === 401) {
        util.kick(); // token invalid or expired
        return null;
    }

    const data = await response.json();
    return data;
}

window.loadLogResults = loadLogResults;
window.loadDailyCheckins = loadDailyCheckins;


function editLock(lockoutTime) {
    if (editingLockout) return; // Prevent multiple edits at once
    editingLockout = true;



    setTimeout(() => {
        editingLockout = false; // Release lock after operation
    }, lockoutTime);
}







/* google calendar link format
const title = "Meeting with Tobi";
const details = "Talk about project progress";
const location = "Toronto, Canada";

// Start and end in UTC, format: YYYYMMDDTHHmmssZ
const start = "20250908T150000Z";
const end = "20250908T160000Z";

const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${start}/${end}`;

window.open(url, "_blank");

*/