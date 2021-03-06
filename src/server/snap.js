'use strict';

const db = require('../db');
const SnapElasticsearch = require('../db/elasticsearch/snap');
const logger = require('../logger');
const config = require('../config');
const licenses = require('./json/open-source-licenses.json');
const utils = require('../utils');

const fs = require('fs');
const mime = require('mime');

function snapIcon(snap) {
    return `${config.server.host}/api/v1/snaps/icon/${snap.store}/${snap.icon_hash}/${snap.name}.png`;
}

function setup(app, success, error) {
    app.get('/api/v1/snaps', (req, res) => {
        let types = req.query.types ? req.query.types.split(',') : null;
        let category = req.query.category ? req.query.category : null;
        let confinement = req.query.confinement ? req.query.confinement.split(',') : null;
        let architecture = req.query.architecture ? req.query.architecture.split(',') : null;
        let license = req.query.license ? [req.query.license] : null;
        if (req.query.license == 'Open Source') {
            license = licenses;
        }

        if (req.query.search && req.query.search.indexOf('author:') !== 0) {
            //Fetch apps from elasticsearch

            let filters = {
                and: []
            };

            if (types) {
                filters.and.push({in: {
                    type: types
                }});
            }

            if (category) {
                filters.and.push({terms: {
                    'categories': category
                }});
            }

            if (confinement) {
                filters.and.push({in: {
                    confinement: confinement
                }});
            }

            if (architecture) {
                filters.and.push({in: {
                    architecture: architecture
                }});
            }

            if (license) {
                filters.and.push({in: {
                    license: license
                }});
            }

            let field = null;
            let direction = 'asc';
            if (req.query.sort && req.query.sort != 'relevance') {
                if (req.query.sort.charAt(0) == '-') {
                    direction = 'desc';
                    field = req.query.sort.substring(1);
                }
                else {
                    field = req.query.sort;
                }
            }

            let ses = new SnapElasticsearch();
            ses.search(req.query.search, {field: field, direction: direction}, filters, req.query.skip, req.query.limit).then((response) => {
                success(res, {
                    //TODO next/previous links

                    count: response.hits.total,
                    snaps: response.hits.hits.map((snap) => {
                        snap._source.icon = snapIcon(snap._source);
                        return snap._source;
                    })
                });
            });
        }
        else {
            //Fetch apps from mongo

            let query = {};

            if (types) {
                query.type = {$in: types};
            }

            if (category) {
                query.categories = category;
            }

            if (confinement) {
                query.confinement = {$in: confinement};
            }

            if (architecture) {
                query.architecture = {$in: architecture};
            }

            if (license) {
                query.license = {$in: license};
            }

            if (req.query.search && req.query.search.indexOf('author:') === 0) {
                query.author = req.query.search.replace('author:', '').trim();
            }

            let findQuery = db.Snap.find(query);
            if (req.query.limit) {
                findQuery.limit(parseInt(req.query.limit));
            }

            if (req.query.skip) {
                findQuery.skip(parseInt(req.query.skip));
            }

            if (req.query.sort) {
                if (req.query.sort == 'relevance') {
                    findQuery.sort('-points');
                }
                else {
                    findQuery.sort(req.query.sort);
                }
            }

            Promise.all([
                db.Snap.count(query).exec(),
                findQuery.exec(),
            ]).then((results) => {
                success(res, {
                    //TODO next/previous links

                    count: results[0],
                    snaps: results[1].map((snap) => {
                        snap.icon = snapIcon(snap);
                        return snap;
                    }),
                });
            }).catch((err) => {
                logger.warning('Error fetching snap packages from mongo:', err);
                error(res, 'Could not load the snap list at this time, please try again later');
            });
        }
    });

    app.get('/api/v1/snaps/:store/:name', (req, res) => {
        db.Snap.findOne({store: req.params.store, name: req.params.name}).then((snap) => {
            snap.icon = snapIcon(snap);

            //TODO author apps & related apps
            snap.author_snaps = [];
            snap.related_snaps = [];

            success(res, snap);
        }).catch(() => {
            error(res, `Snap ${req.params.name} was not found in the ${req.params.store} store`, 404);
        });
    });

    app.get('/api/v1/snaps/icon/:store/:hash/:name', function(req, res) {
        var name = req.params.name;
        if (name.indexOf('.png') == (name.length - 4)) {
            name = name.replace('.png', '');
        }

        db.Snap.findOne({name: name}).then((snap) => {
            if (!snap || !snap.icon) {
                throw '404';
            }

            let filename = `${config.data_dir}/${snap.icon_hash}-${snap.name}`;
            if (fs.existsSync(filename)) {
                return filename;
            }
            else {
                return utils.downloadAsync(snap.icon, filename);
            }
        }).then((filename) => {
            res.setHeader('Content-type', mime.lookup(filename));
            res.setHeader('Cache-Control', 'public, max-age=2592000'); //30 days
            fs.createReadStream(filename).pipe(res);
        }).catch((err) => {
            if (err != 404) {
                logger.error('Failed to download icon', err);
            }

            res.status(404);
            fs.createReadStream(__dirname + config.server.static + '/img/404.png').pipe(res);
        });
    });
}

exports.setup = setup;
exports.snapIcon = snapIcon;
