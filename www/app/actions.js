var tree = require('./state');
var api = require('./api');

module.exports = {
  getCounts: function() {
    if (!tree.get('counts').loaded) {
      tree.set('loading', true);
      api.getCounts().then(function(data) {
        data.loaded = true;
        tree.set('counts', data);
        tree.set('loading', false);
      });
      //TODO catch errors
    }
  },

  getEssentials: function() {
    if (!tree.get('essentials').loaded) {
      api.getEssentials().then(function(data) {
        tree.set('essentials', {
          loaded: true,
          apps: data,
        });
      });
      //TODO catch errors
    }
  },

  getTopApps: function() {
    //TODO caching

    tree.set('loading', true);
    api.getApps({sort: '-points', limit: 12}).then(function(data) {
      tree.set('top', data.apps);
      tree.set('loading', false);
    });
    //TODO catch errors
  },

  getNewApps: function() {
    //TODO caching

    tree.set('loading', true);
    api.getApps({sort: '-published_date', limit: 6}).then(function(data) {
      tree.set('new', data.apps);
      tree.set('loading', false);
    });
    //TODO catch errors
  },

  getApps: function(paging) {
    //TODO caching

    tree.set('loading', true);
    return api.getApps(paging).then(function(data) {
      tree.select('apps').set(JSON.stringify(paging), data);
      tree.set('loading', false);
      return data;
    });
    //TODO catch errors
  },

  getFrameworks: function() {
    if (tree.get('frameworks').length === 0) {
      api.getFrameworks().then(function(data) {
        data.unshift('All');
        tree.set('frameworks', data);
      });
      //TODO catch errors
    }
  },

  getApp: function(name) {
    tree.set('loading', true);
    tree.set('app', {});
    api.getApp(name).then(function(data) {
      tree.set('loading', false);
      tree.set('app', data);
    });
    //TODO catch errors
  },

  getReviews: function(name, params) {
    if (name != tree.select('reviews').get().name) {
      tree.set('reviews', {loaded: false});
    }

    api.getReviews(name, params).then(function(data) {
      data.loaded = true;
      data.params = params;

      if (data.name == tree.select('reviews').get().name) {
        var reviews = tree.select('reviews').get();

        tree.set('reviews', {
          reviews: reviews.reviews.concat(data.reviews),
          more: data.more,
          params: params,
          name: data.name,
          loaded: true,
          stats: data.stats,
        });
      }
      else {
        tree.set('reviews', data);
      }
    });
    //TODO catch errors
  },

  login: function() {
    return api.login().then(function(user) {
      tree.set('auth', {
        loggedin: true,
        user: user,
        authorization: btoa(user.apikey + ':' + user.apisecret),
      });

      return tree.get('auth');
    }).catch(function() {
      tree.set('auth', {
        loggedin: false,
        user: null,
        authorization: null,
      });

      return tree.get('auth');
    });
  },

  logout: function() {
    tree.set('auth', {
      loggedin: false,
      user: null,
      authorization: null,
    });

    window.location.href = '/auth/logout';
  },

  saveSettings: function(settings) {
    tree.set('savingSettings', true);

    api.saveCaxton(settings.caxton).then(function() {
      tree.set('savingSettings', false);
      tree.set(['auth', 'has_caxton'], !!settings.caxton);
    });
    //TODO catch errors
  },

  sendCaxton: function(url, message) {
    return api.sendCaxton(url, message).then(function() {
      return true;
    }).catch(function() {
      return false; //TODO make this also an error message
    });
  },

  getUserLists: function() {
    tree.set('userLists', {
      loaded: false,
      lists: [],
    });

    api.getUserLists(tree.get('auth').user._id).then(function(lists) {
      tree.set('userLists', {
        loaded: true,
        lists: lists,
      });
    });
    //TODO catch errors
  },

  getUserList: function(id) {
    tree.set('loading', true);
    return api.getUserList(id).then(function(list) {
      tree.set('userList', list);
      tree.set('loading', false);
    });
    //TODO catch errors
  },

  createUserList: function(list) {
    return api.createUserList(list);
    //TODO catch errors
  },

  updateUserList: function(id, list) {
    return api.updateUserList(id, list);
    //TODO catch errors
  },

  deleteUserList: function(id) {
    return api.deleteUserList(id);
    //TODO catch errors
  },

  removeUserListApp: function(list, name) {
    var packages = [];
    var full_packages = [];
    for (var i = 0; i < list.packages.length; i++) {
      if (list.packages[i] != name) {
        packages.push(list.packages[i]);
      }

      if (list.full_packages[i].name != name) {
        full_packages.push(list.full_packages[i]);
      }
    }

    var newList = JSON.parse(JSON.stringify(list));
    newList.packages = packages;
    newList.full_packages = full_packages;

    tree.set('userList', newList);
    return this.updateUserList(list._id, newList);
  },

  addUserListApp: function(list, name) {
    var newList = JSON.parse(JSON.stringify(list));
    newList.packages.push(name);

    return this.updateUserList(list._id, newList);
  },

  createAlert: function(text, type, callback) {
    tree.set('alert', {
      text: text,
      type: type ? type : 'error',
      callback: callback ? callback : null,
    });
  },

  clearAlert: function() {
    tree.set('alert', null);
  },
};
