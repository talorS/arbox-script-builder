const xlsx = require('xlsx');

exports.readDataFromXlsxFile = function (xlsxFilePath) {
    return xlsx.readFile(xlsxFilePath,{type:'binary',cellDates:true,cellNF: false,cellText:false});
}

exports.xlsxToJson = function (sheet) {
    return xlsx.utils.sheet_to_json(sheet,{raw:false, dateNF:'dd/mm/yyyy'});
}

