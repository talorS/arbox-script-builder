const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv)).argv;
const fileReader = require('./DAL/fileReader');
const fileWriter = require('./DAL/fileWriter');

//Tables name
const USERS_TABLE = "users";
const MEMBERSHIPS_TABLE = "memberships";

//relative files path
const DIR_NAME = './assets/';
const OUTPUT_FILE_NAME = 'script.sql';

//Column that stores the id (primary key) in each excel sheets
const ID_COL = 'A';
//---------------------------------------------------------------
async function main() {
    //checks if we've received 3 parameters 
    if (!argv.fileClub || !argv.fileDb || !argv.clubId)
        throw new Error("Usage: --file-db=<filename> --file-club=<filename> --club-id=<id>");

    //reading xlsx 
    const workbookClub = fileReader.readDataFromXlsxFile(DIR_NAME + argv.fileClub);
    const workbookDB = fileReader.readDataFromXlsxFile(DIR_NAME + argv.fileDb);

    //get max id of each arbox db table
    let maxUserId;
    let maxMemberId;
    Object.values(workbookDB.Sheets).forEach((worksheet, index) => {
        index === 0 ? maxUserId = getMaxId(worksheet, ID_COL) : maxMemberId = getMaxId(worksheet, ID_COL);
    });

    //iterate over club's workbook and create the data for the query
    const users = [];
    const members = [];
    Object.values(workbookClub.Sheets).forEach(worksheet => {
        const emails = [];
        const data = fileReader.xlsxToJson(worksheet);
        data.forEach(row => {
            if (duplicateEmail(emails, row.email))
                throw new Error("All emails must be unique!");
            emails.push(row.email);
            users.push(setUsers(row, maxUserId, argv.clubId));
            members.push(setMemberships(row, maxUserId, maxMemberId));
            maxUserId++;
            maxMemberId++;
        });
    });

    await createQueryScript(users, USERS_TABLE);
    await createQueryScript(members, MEMBERSHIPS_TABLE);
    console.log(`Script created successfully at ${__dirname}\\assets\\${OUTPUT_FILE_NAME}`);
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error(err.message);
        process.exit(1);
    });
//---------------------------------------------------------------
/*
get max id of each worksheet based on column
@param worksheet - the current worksheet (table)
@param col - the column that stores the id values
*/
function getMaxId(worksheet, col) {
    const regex = new RegExp(`^${col}\\d+`, "g");
    const arr = Object.keys(worksheet).filter(x => regex.test(x)).map(x => worksheet[x].v).filter(x => /[0-9]/.test(x));
    return Math.max.apply(null, arr) + 1;
}
//---------------------------------------------------------------
/*
Checks if the woorksheet does not contains email duplicates
@param arr - list of emails
*/
function duplicateEmail(arr, item) {
    return arr.includes(item);
}
//---------------------------------------------------------------
/*
Data shapping for users table
@param row - the current row in json object of the woorksheet
@param maxUserId - the current max user id (primaky key) in users table
@param clubId - the club id in the internal systems
*/
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
//---------------------------------------------------------------
/*
Data shapping for memberships table
@param row - the current row in json object of the woorksheet
@param maxUserId - the current max user id (primaky key) in users table
@param maxMemberId - the current max membership id (primaky key) in memberships table
*/
function setMemberships(row, maxUserId, maxMemberId) {
    const member = {};
    member.id = maxMemberId;
    member.user_id = maxUserId;
    member.start_date = row.membershp_start_date;
    member.end_date = row.membership_end_date;
    member.membership_name = row.membership_name;
    return member;
}
//---------------------------------------------------------------
/*
Creates the query that inserts to the db sequentially
@param arr - list of table columns and their values
@param dbName - the db name we insert values
*/
async function createQueryScript(arr, dbName) {
    let query = '';
    
    arr.forEach((obj) => {
        query += `INSERT INTO [ar_db].[${dbName}] (${Object.keys(obj)}) VALUES (${Object.values(obj)});\r\n`;
    });
    
    await fileWriter.writeDataToFile(DIR_NAME + OUTPUT_FILE_NAME, query);
}

