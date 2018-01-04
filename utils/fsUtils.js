const fs = require('fs');
const path = require('path');

function deleteFile(dir, file) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(dir, file);
    fs.lstat(filePath, (err, stats) => {
      if(err) return reject(err);
      if(stats.isDirectory()) {
        resolve(deleteDirectory(filePath));
      } else {
        fs.unlink(filePath, (err) => {
          if(err) return reject(err);
          resolve();
        });
      }
    });
  });
}

function deleteDirectory(dir) {
  return new Promise((resolve, reject) => {
    fs.access(dir, (err) => {
      if(err) return reject(err);
      fs.readdir(dir, (err, files) => {
        if(err) return reject(err);
        Promise.all(files.map(file => deleteFile(dir, file))).then(() => {
          fs.rmdir(dir, (err) => {
            if(err) return reject(err);
            resolve();
          });
        }).catch(reject);
      });
    });
  });
}

module.exports = {
  deleteFile,
  deleteDirectory,
};
