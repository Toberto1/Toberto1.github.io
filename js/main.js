import * as api from './api.js';
import * as util from './utils.js';
import * as dom from './domElements.js';
import * as global from './globals.js';


const token = localStorage.getItem('token');


if (!token) {
    window.location.href = '/auth.html';
} else {
    fetch(`${global.API_IP}/api/auth/verifyToken`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' // include if you send a body (optional here)
        }
    })
        .then(res => {
            if (!res.ok) throw new Error('Invalid token');
            // token is valid, proceed
        })
        .catch(() => {
            localStorage.removeItem('token');
            util.kick();
        });
}

const VERSION = "1.0.1";

async function checkVersion() {
    try {
        const res = await fetch(`${global.API_IP}/api/mmVersion`, { cache: "no-store" });
        const { version: currentVersion } = await res.json();

        if (currentVersion !== VERSION) {
            showTopHeaderDialog("An update is being rolled out... please wait", { error: true });
            setTimeout(() => util.kick(), 3000); // force reload, bypass cache
        }
    } catch (err) {
        showTopHeaderDialog("Failed to check version. Please refresh the page.", { error: true });
        console.error("Version check failed", err);
    }
}

// Check every 5 minutes
setInterval(checkVersion, 15 * 60 * 1000);

// Also check immediately on page load
checkVersion();

//Get DOM elements

const searchBar = document.getElementById('searchInput');
const resultsBody = document.getElementById('searchResults');

const addAccountContainer = document.getElementById("addAccount-container");
const dailyCheckinDate = document.getElementById("dailyCheckinDate");
const filterRow = document.querySelectorAll(".filter-checkbox");

//Set up page

//Set up add acount tab
addAccountContainer.appendChild(dom.createPersonalInfoFieldset(null));
addAccountContainer.appendChild(dom.createMembershipFieldset(null));
addAccountContainer.appendChild(dom.createPassFieldset(null));
addAccountContainer.appendChild(dom.createNotesFieldset(null));
document.getElementById("addAccountNavColumn").appendChild(dom.createSubmitFieldset(null));






// Default to today
const today = util.getTodayString();
dailyCheckinDate.value = today;

// Update label when date changes
dailyCheckinDate.addEventListener("change", () => {
    api.loadDailyCheckins(today);
});

// Run on load to show the first active tab content
window.addEventListener('DOMContentLoaded', () => {

    const tabsChecked = document.querySelector('input[name="tabs"]:checked');
    if (tabsChecked) tabsChecked.dispatchEvent(new Event('change'));

    const addAccountTabChecked = document.querySelector('input[name="addAccountTabs"]:checked');
    if (addAccountTabChecked) addAccountTabChecked.dispatchEvent(new Event('change'));


    //set up log filters
    util.applyPreset('today');
    api.loadLogResults();
    api.loadSearchTableResults();
    api.loadDailyCheckins(today);
});

document.getElementById("clear-search").addEventListener("click", () => {
    searchBar.value = "";
    for (let item of filterRow) {
        item.checked = false;
    }
    api.loadSearchTableResults();
});

for (let item of filterRow) {
    item.addEventListener("change", () => {
        api.loadSearchTableResults();
    });
}

//-------Event Listners---------//
document.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', () => {
        element.classList.remove("missing");
    });
});

document.getElementById("clearAccountFilterBtn").addEventListener("click", () => {
    global.setSelectedAccountForLog(null);
    util.applyPreset('today');

    util.whiteFlash("log-container");

    util.toggleElement("selectedAccountInfoButton");
    util.toggleElement("clearAccountFilterBtn");

    document.getElementById("log-container-edit-shortcut")?.remove();

    api.loadLogResults();
});



//Input listener for tab element
document.querySelectorAll('input[name="tabs"]').forEach((radio, index) => {
    radio.addEventListener('change', () => {
        dom.swapTab(index);
    });
});

document.querySelectorAll('input[name="addAccountTabs"]').forEach((radio, radioIndex) => {
    radio.addEventListener('change', () => {
        const tabContainers = document.querySelectorAll('.tab-content-addAccount');
        tabContainers.forEach((tab, tabIndex) => {
            tab.classList.toggle('active', tabIndex === radioIndex);
        });
    });
});

document.querySelectorAll('input[name="editAccountTabs"]').forEach((radio, radioIndex) => {
    radio.addEventListener('change', () => {
        const tabContainers = document.querySelectorAll('.tab-content-editAccount');
        tabContainers.forEach((tab, tabIndex) => {
            tab.classList.toggle('active', tabIndex === radioIndex);
        });
    });
});

const searchMethodSelect = document.getElementById("searchMethodSelect");
searchMethodSelect.addEventListener("change", () => {
    const method = searchMethodSelect.value;
    global.setSearchMethod(method);

    switch (method) {
        case "name":
            searchBar.placeholder = "Search by name (Last, First)";
            document.getElementById("searchMethodTableHead").innerText = "Name";
            break;
        case "email":
            searchBar.placeholder = "Search by email (example@domain.com)";
            document.getElementById("searchMethodTableHead").innerText = "Email";
            break;
        case "phone_number":
            searchBar.placeholder = "Search by phone number (xxx-xxx-xxxx)";
            document.getElementById("searchMethodTableHead").innerText = "Phone";
            break;
    }

    api.loadSearchTableResults();
    util.whiteFlash("search-container");
});


document.querySelectorAll(".go-to-search").forEach(button => {
    button.addEventListener("click", () => {
        dom.swapTab(global.tabIndexs.search);
    });
});


const logActionType = document.getElementById("log-action-type");
for (const key in global.logActions) {
    if (global.logActions.hasOwnProperty(key)) {
        logActionType.innerHTML += `<option value="${key}">${global.logActions[key]}</option>`;
    }
}

const logFilterToggleBtn = document.getElementById("filter-log-toggle-btn");
logFilterToggleBtn.addEventListener("click", dom.toggleLogFilterRow);



//Input listener for search bar
searchBar.addEventListener('input', util.debounce(async (e) => {
    const searchTerm = e.target.value.trim();

    try {
        api.loadSearchTableResults();
    } catch (error) {
        console.error('Error fetching search results:', error);
        resultsBody.innerHTML = resultsBody.innerHTML = '<tr><td colspan="4" class="tooltipText" style="vertical-align: top;">Something went wrong</td></tr>';

    } 
}, 300)); // debounce delay of 300ms


//-------Functions---------//

window.addMembershipRow = function (type) {
    const row = dom.membershipFormRow(null);
    const container = document.getElementById(`membershipFieldset-${type}`);
    container.insertBefore(row, container.children[3]);
    util.whiteFlash(row.id);
}
window.renewMembershipRow = function (type, membership) {
    const row = dom.createRenewedMembershipRow(membership);
    const container = document.getElementById(`membershipFieldset-${type}`);
    container.insertBefore(row, container.children[3]);
    util.whiteFlash(row.id);
}
window.adjustPunches = function (inputId, amount) {
    const input = document.getElementById(inputId);
    if (!input) return;

    // Update the value
    const currentValue = parseInt(input.value) || 0;
    const newValue = Math.max(0, currentValue + amount);
    input.value = newValue;

    // Find the matching sticker label (the one right before the input)
    const sticker = input.previousElementSibling;
    if (sticker && sticker.classList.contains('sticker')) {
        if (newValue === 0) {
            sticker.style.opacity = '0.4';
        } else {
            sticker.style.opacity = '1';
        }
        sticker.style.transition = 'opacity 0.3s ease';
    }

    // Keep your white flash
    util.whiteFlash("passFieldset-add");
    util.whiteFlash("passFieldset-edit");
};

document.querySelectorAll('.only-numbers').forEach(inputElement => {
    inputElement.addEventListener('input', () => {
        inputElement.value = inputElement.value.replace(/\D/g, '');
    });
});

document.getElementById("refresh-daily-checkins").addEventListener("click", () => {
    api.loadDailyCheckins(today);
});

document.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('input', () => {
        element.classList.remove("missing");
    });
    element.addEventListener('change', () => {
        element.classList.remove("missing");
    });
});

window.saveEditedMember = async function () {

    document.querySelectorAll('input, select').forEach((element) => {
        element.classList.remove("missing");
    });

    // Get values
    const name = document.getElementById("name-edit")?.value.trim() || '';
    const email = document.getElementById("email-edit")?.value.trim() || '';
    const phone_number = document.getElementById("phone-number-edit")?.value.trim() || '';
    const notes = document.getElementById("notes-edit")?.value.trim() || '';
    const openGym = parseInt(document.getElementById("opengymPunches-edit")?.value) || 0;
    const classes = parseInt(document.getElementById("classesPunches-edit")?.value) || 0;
    const privateKids = parseInt(document.getElementById("privatekidsPunches-edit")?.value) || 0;
    const privateAdults = parseInt(document.getElementById("privateadultPunches-edit")?.value) || 0;
    const aerialSilks = parseInt(document.getElementById("aerialsilksPunches-edit")?.value) || 0;
    const addAccountButton = document.getElementById("edit-account-button");
    const AccountId = global.getselectedAccountForEdit().id;


    //Validity checks 
    if (!name) {
        showTopHeaderDialog('Name cannot be empty.', { error: true });
        util.inputMissing('name-edit');
        return;
    }
    // if (!email && !phone_number) {
    //     showTopHeaderDialog('Email And phone number cannot both be empty.',{error : true});
    //     util.inputMissing('email-edit');
    //     util.inputMissing('phone-number-edit');
    //     return;
    // }
    if (openGym < 0 || classes < 0 || privateKids < 0 || privateAdults < 0 || aerialSilks < 0) {
        showTopHeaderDialog('Pass counts cannot be negative.', { error: true });
        return;
    }

    const rows = Array.from(document.getElementById("editAccount-container").getElementsByClassName("membership-row"));
    for (let row of rows) {
        let i = parseInt(row.id.split('-')[3]); //Get dom id 
        let suffix = row.id.split('-')[2];
        let type = document.getElementById(`membership-type-${suffix}-${i}`).value;
        let startDate = document.getElementById(`startDate-${suffix}-${i}`).value;
        let endDate = document.getElementById(`endDate-${suffix}-${i}`).value;
        let addedDays = document.getElementById(`daysAdded-${suffix}-${i}`);
        let ageGroup = document.getElementById(`ageGroupSelect-${suffix}-${i}`).value;

        if (type === '') {
            showTopHeaderDialog('Please select a membership type.', { error: true });
            util.inputMissing(`membership-type-${suffix}-${i}`);
            return;
        }
        if ((type === 'class' || type === 'athletic') && ageGroup === '' && !util.isExpired(endDate)) {
            showTopHeaderDialog('Age group is required for Classes or Athletic memberships.', { error: true });
            util.inputMissing(`ageGroupSelect-${suffix}-${i}`);
            return;
        }
        if (type === 'open') ageGroup = 'NA';
        if (startDate && isNaN(new Date(startDate).getTime())) {
            showTopHeaderDialog('Invalid Start Date. Use YYYY-MM-DD.', { error: true });
            util.inputMissing(`startDate-${suffix}-${i}`);
            return;
        }
        if (startDate === '') {
            showTopHeaderDialog('Start date is required for memberships.', { error: true });
            util.inputMissing(`startDate-${suffix}-${i}`);
            return;
        }
        if ((addedDays.value === '' || parseInt(addedDays.value) <= 0) && addedDays.placeholder !== '∞') {
            showTopHeaderDialog('Day duration is required for memberships.', { error: true });
            util.inputMissing(`daysAdded-${suffix}-${i}`);
            return;
        }
    }

    // ---------- SEND REQUEST ----------
    addAccountButton.disabled = true;
    addAccountButton.style.opacity = '0.6';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
        // Step 1: Create Account
        const userRes = await fetch(`${global.API_IP}/api/users/editUser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${global.getToken()}` },

            body: JSON.stringify({
                id: AccountId,
                name: name,
                email: email,
                phone_number: phone_number,
                password: "",
                notes: notes,
                opengympasses: openGym,
                classpasses: classes,
                privatekidpasses: privateKids,
                privateadultpasses: privateAdults,
                aerialsilkspasses: aerialSilks
            }),
            signal: controller.signal
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || 'Signup failed');


        for (let row of rows) {

            let i = parseInt(row.id.split('-')[3]);
            let suffix = row.id.split('-')[2];

            let type = document.getElementById(`membership-type-${suffix}-${i}`).value;
            let startDate = document.getElementById(`startDate-${suffix}-${i}`).value;
            let addedDays = document.getElementById(`daysAdded-${suffix}-${i}`);
            let ageGroup = document.getElementById(`ageGroupSelect-${suffix}-${i}`).value;
            let endDate = document.getElementById(`endDate-${suffix}-${i}`).value;
            let isUnlimited = (addedDays.placeholder === '∞');
            let isPaused = document.getElementById(`pause-${suffix}-${i}`).checked;
            let isClosed = (suffix === "edit") ? document.getElementById(`closed-${suffix}-${i}`).checked : false;


            if (row.dataset.membershipId == -1) { //New membership not previously held

                // Step 2: Create membership (if applicable)
                if (type && startDate) {

                    const membershipPayload = {
                        userId: AccountId,
                        type: type,
                        start_date: startDate,
                        end_date: isUnlimited ? null : endDate,
                        base_length: parseInt(addedDays.value),
                        is_unlimited: isUnlimited,
                        age_group: ageGroup === '' ? 'NA' : ageGroup,
                        is_paused: isPaused,
                        is_closed: false
                    };

                    const membershipRes = await fetch(`${global.API_IP}/api/memberships/addMembership`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${global.getToken()}` },
                        body: JSON.stringify(membershipPayload),
                        signal: controller.signal
                    });

                    const membershipData = await membershipRes.json();

                    if (!membershipRes.ok) throw new Error(membershipData.error || 'Membership creation failed');
                }
            } else {
                // Step 2: Create membership (if applicable)
                if (type && startDate) {

                    const membershipPayload = {
                        membershipId: row.dataset.membershipId,
                        type: type,
                        start_date: startDate,
                        end_date: isUnlimited ? null : endDate,
                        base_length: parseInt(addedDays.value),
                        is_unlimited: isUnlimited,
                        age_group: ageGroup === '' ? 'NA' : ageGroup,
                        is_paused: isPaused,
                        is_closed: isClosed
                    };

                    const membershipRes = await fetch(`${global.API_IP}/api/memberships/editMembership`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${global.getToken()}` },
                        body: JSON.stringify(membershipPayload),
                        signal: controller.signal
                    });

                    const membershipData = await membershipRes.json();

                    if (!membershipRes.ok) throw new Error(membershipData.error || 'Membership update failed');
                }
            }
        }

        clearTimeout(timeout);
        showTopHeaderDialog("Account updated successfully", { success: true, autoClose: true, duration: 3000 });
        global.setSelectedAccountForEdit(null);
        dom.toggleEditTabButton();
        dom.swapTab(global.tabIndexs.editAccount);
        util.whiteFlash("editAccount-container");
        api.loadSearchTableResults();
        dom.swapTab(global.tabIndexs.search);
    } catch (error) {
        showTopHeaderDialog(error, { error: true });
        throw (error);
    } finally {
        addAccountButton.disabled = false;
        addAccountButton.style.opacity = '1';
    }
}

window.addNewMember = async function () {

    document.querySelectorAll('input, select').forEach((element) => {
        element.classList.remove("missing");
    });

    // Get values
    const name = document.getElementById("name-add")?.value.trim() || '';
    const email = document.getElementById("email-add")?.value.trim() || '';
    const phone_number = document.getElementById("phone-number-add")?.value.trim() || '';
    const notes = document.getElementById("notes-add")?.value.trim() || '';
    const openGym = parseInt(document.getElementById("opengymPunches-add")?.value) || 0;
    const classes = parseInt(document.getElementById("classesPunches-add")?.value) || 0;
    const privateKids = parseInt(document.getElementById("privatekidsPunches-add")?.value) || 0;
    const privateAdults = parseInt(document.getElementById("privateadultPunches-add")?.value) || 0;
    const aerialSilks = parseInt(document.getElementById("aerialsilksPunches-add")?.value) || 0;
    const addAccountButton = document.getElementById("add-account-button");

    //Validity checks 
    if (!name) {
        showTopHeaderDialog('Name cannot be empty.', { error: true });
        util.inputMissing('name-add');
        return;
    }
    if (!email && !phone_number) {
        showTopHeaderDialog('Email And phone number cannot both be empty.', { error: true });
        util.inputMissing('email-add');
        util.inputMissing('phone-number-add');
        return;
    }
    if (openGym < 0 || classes < 0 || privateKids < 0 || privateAdults < 0 || aerialSilks < 0) {
        showTopHeaderDialog('Pass counts cannot be negative.', { error: true });
        return;
    }

    const rows = Array.from(document.getElementById("addAccount-container").getElementsByClassName("membership-row"));
    for (let row of rows) {
        let i = parseInt(row.id.split('-')[3]); //Get dom id 
        let type = document.getElementById(`membership-type-add-${i}`).value;
        let startDate = document.getElementById(`startDate-add-${i}`).value;
        let addedDays = document.getElementById(`daysAdded-add-${i}`);
        let ageGroup = document.getElementById(`ageGroupSelect-add-${i}`).value;

        if (type === '') {
            showTopHeaderDialog('Please select a membership type.', { error: true });
            util.inputMissing(`membership-type-add-${i}`);
            return;
        }
        if ((type === 'class' || type === 'athletic') && ageGroup === '') {
            showTopHeaderDialog('Age group is required for Classes or Athletic memberships.', { error: true });
            util.inputMissing(`ageGroupSelect-add-${i}`);
            return;
        }
        if (type === 'open') ageGroup = 'NA';
        if (startDate && isNaN(new Date(startDate).getTime())) {
            showTopHeaderDialog('Invalid Start Date. Use YYYY-MM-DD.', { error: true });
            util.inputMissing(`startDate-add-${i}`);
            return;
        }
        if (startDate === '') {
            showTopHeaderDialog('Start date is required for memberships.', { error: true });
            util.inputMissing(`startDate-add-${i}`);
            return;
        }
        if ((addedDays.value === '' || parseInt(addedDays.value) <= 0) && addedDays.placeholder !== '∞') {
            showTopHeaderDialog('Day duration is required for memberships.', { error: true });
            util.inputMissing(`daysAdded-add-${i}`);
            return;
        }
    }

    // ---------- SEND REQUEST ----------
    addAccountButton.disabled = true;
    addAccountButton.style.opacity = '0.6';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
        // Step 1: Create Account
        const userRes = await fetch(`${global.API_IP}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${global.getToken()}` },
            body: JSON.stringify({
                name: name,
                email: email,
                phone_number: phone_number,
                password: "",
                notes: notes,
                opengympasses: openGym,
                classpasses: classes,
                privatekidpasses: privateKids,
                privateadultpasses: privateAdults,
                aerialsilkspasses: aerialSilks
            }),
            signal: controller.signal
        });

        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.error || 'Signup failed');

        //Get new user ID after account creation
        const userId = userData.user?.id;

        for (let row of rows) {
            let i = parseInt(row.id.split('-')[3]);

            let type = document.getElementById(`membership-type-add-${i}`).value;
            let startDate = document.getElementById(`startDate-add-${i}`).value;
            let addedDays = document.getElementById(`daysAdded-add-${i}`);
            let ageGroup = document.getElementById(`ageGroupSelect-add-${i}`).value;
            let endDate = document.getElementById(`endDate-add-${i}`).value;
            let isUnlimited = (addedDays.placeholder === '∞');
            let isPaused = document.getElementById(`pause-add-${i}`).checked;

            // Step 2: Create membership (if applicable)
            if (type && startDate) {

                const membershipPayload = {
                    userId: userId,
                    type: type,
                    start_date: startDate,
                    end_date: isUnlimited ? null : endDate,
                    base_length: parseInt(addedDays.value),
                    is_unlimited: isUnlimited,
                    age_group: ageGroup === '' ? 'NA' : ageGroup,
                    is_paused: isPaused
                };

                const membershipRes = await fetch(`${global.API_IP}/api/memberships/addMembership`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${global.getToken()}` },
                    body: JSON.stringify(membershipPayload),
                    signal: controller.signal
                });

                const membershipData = await membershipRes.json();

                if (!membershipRes.ok) throw new Error(membershipData.error || 'Membership creation failed');
            }
        }

        clearTimeout(timeout);
        showTopHeaderDialog("Account added successfully", { success: true, autoClose: true, duration: 3000 });
        util.clearAddAccountTab();
        util.whiteFlash("addAccount-container");
    } catch (error) {
        showTopHeaderDialog(error, { error: true });
    } finally {
        addAccountButton.disabled = false;
        addAccountButton.style.opacity = '1';

    }
}

function showTopHeaderDialog(message, options = {}) {
    const existing = document.getElementById("custom-header-dialog");
    if (existing) existing.remove(); // Only one at a time

    const header = document.createElement("div");
    header.id = "custom-header-dialog";
    header.textContent = message;

    // Optional close button
    if (!options.noClose) {
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.className = "close-btn";
        closeBtn.onclick = () => header.remove();
        header.appendChild(closeBtn);
    }

    if (options.autoClose && options.duration) {
        setTimeout(() => {
            header.remove();
        }, options.duration);
    }

    if (options.error) {
        header.classList.add("error-col");
    }
    if (options.success) {
        header.classList.add("success-col");
    }

    document.body.appendChild(header);
}



//dom.toggleDarkmode(true);