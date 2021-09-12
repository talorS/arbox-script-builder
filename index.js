const { v4: uuidv4 } = require('uuid');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const fileReader = require('./DAL/fileReader');

//tables name
const USERS_TABLE = "users";
const MEMBERSHIPS_TABLE = "memberships";
//column that stores the id (primary key) in the excel sheets
const ID_COL = 'A';

try {
    if (!argv.fileClub || !argv.fileDb || !argv.clubId)
        throw new Error("Usage: --file-db=<path> --file-club=<path> --club-id=<id>");

    const workbookClub = fileReader.readDataFromXlsxFile(argv.fileClub);
    const workbookDB = fileReader.readDataFromXlsxFile(argv.fileDb);

    let maxUserId;
    let maxMemberId;
    Object.values(workbookDB.Sheets).forEach((worksheet, index) => {
        index === 0 ? maxUserId = getMaxId(worksheet, ID_COL) : maxMemberId = getMaxId(worksheet, ID_COL);
    });

    Object.values(workbookClub.Sheets).forEach(worksheet => {
        const users = [];
        const members = [];
        const data = fileReader.xlsxToJson(worksheet);
        data.forEach(row => {
            users.push(setUsers(row, maxUserId, argv.clubId));
            members.push(setMemberships(row, maxUserId, maxMemberId));
            maxUserId++;
            maxMemberId++;
        });

        const emails = users.map(u => u.email);
        if (!uniqueEmails(emails))
            throw new Error("All emails must be unique!");

        createQuery(users, USERS_TABLE);
        createQuery(members, MEMBERSHIPS_TABLE);
    });

} catch (error) {
    console.error(error.message);
}

function getMaxId(worksheet, str) {
    const regex = new RegExp(`^${str}\\d+`, "g");
    const arr = Object.keys(worksheet).filter(x => regex.test(x)).map(x => worksheet[x].v).filter(x => /[0-9]/.test(x));
    return Math.max.apply(null, arr) + 1;
}

function uniqueEmails(arr) {
    return (new Set(arr)).size === arr.length;
}

function setUsers(row, maxUserId, clubId) {
    const user = {};
    user.id = maxUserId;
    user.first_name = row.first_name;
    user.last_name = row.last_name;
    user.phone = row.phone;
    user.email = row.email;
    user.joined_at = row.membershp_start_date;
    user.club_id = clubId;
    return user;
}

function setMemberships(row, maxUserId, maxMemberId) {
    const member = {};
    member.id = maxMemberId;
    member.user_id = maxUserId;
    member.start_date = row.membershp_start_date;
    member.end_date = row.membership_end_date;
    member.membership_name = row.membership_name;
    return member;
}

function createQuery(arr, dbName) {
    arr.forEach(obj => {
        console.log(`INSERT INTO [ar_db].[${dbName}] (${Object.keys(obj)}) VALUES (${Object.values(obj)});`);
    });
}

function generateUniqueID() {
    const id = uuidv4();
    console.log(id);
    console.log(Math.floor(Math.random() * 100));
};
