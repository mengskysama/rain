
exports.ERR_MISSING_ARGUMENT = {errCode: 10001, errMsg: 'missing request argument'}
exports.ERR_MISSING_SESSION = {errCode: 10002, errMsg: 'please login'}
exports.ERR_SEND_MAIL = {errCode: 10003, errMsg: 'email send failed please retry later'}
exports.ERR_INVAILD_ANSWERED = {errCode: 10003, errMsg: 'check your captcha answered'}
// user
exports.ERR_INVAILD_EMAIL = {errCode: 10100, errMsg: 'invalid email'}
exports.ERR_INVAILD_PASSWORD = {errCode: 10101, errMsg: 'invalid password'}
exports.ERR_INVAILD_CAPTCHA = {errCode: 10102, errMsg: 'invalid captcha'}
exports.ERR_EMAIL_ALREAD_EXIST = {errCode: 10103, errMsg: 'email already exist'}
exports.ERR_INVAILD_INFOHASH = {errCode: 10104, errMsg: 'invalid torrent info_hash'}
exports.ERR_INVAILD_EMAIL_OR_PASSWORD = {errCode: 10105, errMsg: 'invalid email or password'}
// torrent
exports.ERR_TORRENT_BIN_NOT_FOUND = {errCode: 10200, errMsg: 'please upload torrent'}
exports.ERR_TORRENT_BIN_INVAILD = {errCode: 10201, errMsg: 'invalid torrent'}
exports.ERR_TORRENT_BIN_TOO_LARGE = {errCode: 10202, errMsg: 'torrent too large'}
exports.ERR_TORRENT_FILES_LENGTH_TOO_LARGE = {errCode: 10203, errMsg: 'torrent files length too large'}
exports.ERR_TORRENT_FILES_TOO_MUCH = {errCode: 10204, errMsg: 'torrent fils too much'}
// task
exports.ERR_TASK_NOT_FOUND = {errCode: 10300, errMsg: 'task not found'}
exports.ERR_TASK_EXISTS = {errCode: 10301, errMsg: 'task already exists'}
exports.ERR_TOO_MANY_TASH = {errCode: 10302, errMsg: 'too many task in processing'}
// file
exports.ERR_FILE_NOT_FOUND = {errCode: 10400, errMsg: 'file not found'}
// api
exports.ERR_NODE_RESPONSE_ERROR = {errCode: 10500, errMsg: 'node response error'}
// magnet
exports.ERR_MAGNET_FORMAT = {errCode: 10600, errMsg: 'please input magnet or hash'}
exports.ERR_MAGNET_NOT_FOUND = {errCode: 10600, errMsg: 'magnet not found'}
exports.ERR_MAGNET_FETCH_ERROR = {errCode: 10601, errMsg: 'magnet fetch error'}

exports.formatError = (err) => {
    if (err.message === 'Not Found') {
        return {errCode: 10001, errMsg: 'resource your request not found'}
    } else {
        console.log(err)
        return {
            errCode: err.errCode || 10000,
            errMsg: err.errMsg || 'undefine error'
        }
    }
}
