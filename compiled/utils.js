"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filewalker = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
/**
 * Explores recursively a directory and returns all the filepaths and folderpaths in the callback.
 *
 * @see http://stackoverflow.com/a/5827895/4241030
 * @param {String} dir
 * @param {Function} done
 */
function filewalker(dir, done) {
    let results = [];
    fs_1.default.readdir(dir, function (err, list) {
        if (err)
            return done(err, results);
        let pending = list.length;
        if (!pending)
            return done(null, results);
        list.forEach(function (file) {
            file = path_1.default.resolve(dir, file);
            fs_1.default.stat(file, function (err, stat) {
                // If directory, execute a recursive call
                if (stat && stat.isDirectory()) {
                    // Add directory to array [comment if you need to remove the directories from the array]
                    results.push(file);
                    filewalker(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending)
                            done(null, results);
                    });
                }
                else {
                    results.push(file);
                    if (!--pending)
                        done(null, results);
                }
            });
        });
    });
}
exports.filewalker = filewalker;
