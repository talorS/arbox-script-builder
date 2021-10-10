const fs = require('fs');

exports.writeDataToFile = function (file, data) {
    return new Promise((resolve, reject) => {
        //writeFile() doing : fs.open() -> fs.write() -> fs.close()
        fs.writeFile(file, data, { flag: "a" }, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve('Success');
            }
        })
    })
}

