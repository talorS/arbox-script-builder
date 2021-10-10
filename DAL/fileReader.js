const xlsx = require('xlsx');

/*
reading data from xlsx file using module 'xlsx'
@param xlsxFilePath - the file path
*/
exports.readDataFromXlsxFile = function (xlsxFilePath) {
    return xlsx.readFile(xlsxFilePath,{type:'binary',cellDates:true,cellNF:false,cellText:false});
}

/*
convert worksheet to json object using module 'xlsx'
@param sheet - the current worksheet
*/
exports.xlsxToJson = function (sheet) {
    return xlsx.utils.sheet_to_json(sheet,{raw:false, dateNF:'dd/mm/yyyy'});
}

