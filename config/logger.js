const { createLogger, transports, format } = require('winston');

var fileLogger =
    createLogger(
        {
            transports:
                [
                    new transports.File(
                        { filename: 'log_files/info.log', level: 'info', format: format.combine(format.timestamp(), format.json()) }),
                    new transports.File(
                        { filename: 'log_files/error.log', level: 'error', format: format.combine(format.timestamp(), format.simple()) }),
                ]
        });

var tokenLogger =
    createLogger(
        {
            transports:
                [
                    new transports.File(
                        { filename: 'log_files/token.log', level: 'info', format: format.combine(format.timestamp(), format.json()) }),
                ]
        });

var playlistLogger =
    createLogger(
        {
            transports:
                [
                    new transports.File(
                        { filename: 'log_files/playlist.log', level: 'info', format: format.combine(format.timestamp(), format.json()) }),
                ]
        });



module.exports = { fileLogger, tokenLogger, playlistLogger };