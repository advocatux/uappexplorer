app.factory('api', function($q, $http) {
  return {
    apps: function(paging) {
      paging = angular.copy(paging);
      _.forEach(paging.query, function(q) {
        if (_.isObject(q) && q['_$in']) {
          q['$in'] = q['_$in'];
          q['_$in'] = undefined;
        }
      });

      var apps_deferred = $q.defer();
      $http.get('/api/apps', {
        params: paging
      }).then(function(res) {
        var apps = _.sortBy(res.data.data, paging.sort);
        apps_deferred.resolve(apps);
      }, function(err) {
        apps_deferred.reject(err);
      });

      var count_deferred = $q.defer();
      $http.get('/api/apps?count=true', {
        params: paging
      }).then(function(res) {
        var app_count = res.data.data;
        count_deferred.resolve(app_count);
      }, function(err) {
        count_deferred.reject(err);
      });

      return $q.all({
        'apps': apps_deferred.promise,
        'count': count_deferred.promise,
      });
    },

    categories: function() {
      var deferred = $q.defer();
      $http.get('/api/categories').then(function(res) {
        var categories = [{name: 'All', internal_name: 'all'}];
        _.forEach(res.data.data, function(category) {
          categories.push(category);
        });

        deferred.resolve(categories);
      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    },

    frameworks: function() {
      var deferred = $q.defer();
      $http.get('/api/frameworks').then(function(res) {
        var frameworks = ['All'];
        _.forEach(res.data.data, function(framework) {
          frameworks.push(framework);
        });

        deferred.resolve(frameworks);
      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    },

    app: function(name) {
      var deferred = $q.defer();
      $http.get('/api/apps/' + name).then(function(res) {
        var app = res.data.data;
        app.loading_reviews = true;

        $http.get('/api/apps/reviews/' + name).then(function(res) {
          if (app.name == res.data.data.name) {
            app.reviews = res.data.data.reviews;
          }
        }).finally(function() {
          app.loading_reviews = false;
        });

        deferred.resolve(app);
      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    }
  };
});