
import * as util from './utils.js';
import * as global from './globals.js';
import * as dom from './domElements.js';


const dailyCheckinDate = document.getElementById("dailyCheckinDate");
dailyCheckinDate.value = util.getTodayString();

// Update label when date changes
dailyCheckinDate.addEventListener("change", () => {
    loadDailyCheckins(dailyCheckinDate.value);
});

document.getElementById("refresh-daily-checkins").addEventListener("click", () => {
    loadDailyCheckins(dailyCheckinDate.value);
});

async function fetchDailyCheckins(startTime, endTime) {
    const response = await fetch(`${global.API_IP}/api/logs/fetchDailyCheckins`, {
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

export async function loadDailyCheckins(date) {

    const startTime = new Date(`${date}T00:00:00`).toISOString();
    const endTime = new Date(`${date}T23:59:59.999`).toISOString();

    const data = await fetchDailyCheckins(startTime, endTime);

    const container = document.getElementById("dailyCheckin-container");
    container.style.fontSize = "14px";

    const list = document.getElementById("dailyCheckin-list");
    list.innerHTML = ''; // clear old entries

    const entries = util.groupPassEntries(data);

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

            if (entry.field !== '') {
                fieldDiv.classList.add("sticker");

                if (util.passDBToReadable(entry.field) !== '') {
                    fieldDiv.textContent = util.passDBToReadable(entry.field);
                    fieldDiv.classList.add(`${entry.field}-color`);
                } else if (util.membershipDBToReadable(entry.field) !== '') {
                    fieldDiv.textContent = util.membershipDBToReadable(entry.field);
                    fieldDiv.classList.add(`${entry.field}-color`);
                }
                
                else {
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



window.loadDailyCheckins = loadDailyCheckins;