'use strict';

angular.module('appstore').controller('indexCtrl', function ($scope, $rootScope, $state, $timeout, $location, $modal, ipCookie, utils, auth, og) {
  og.set('uApp Explorer', {});
  $scope.url = $location.protocol() + '://' + $location.host() + '/';
  $scope.$state = $state;
  $rootScope.loggedin = false;

  $timeout(function() {
    $('.swipebox').swipebox();
  });

  $rootScope.dismissError = function() {
    $rootScope.error = '';
    if ($rootScope.errorCallback) {
      $rootScope.errorCallback();
      $rootScope.errorCallback = null;
    }
  };

  $rootScope.setError = function(error, errorCallback, errorClass) { //TODO refactor these var/fn names
    $rootScope.error = error;
    $rootScope.errorCallback = errorCallback;
    $rootScope.errorClass = errorClass;
  };

  $scope.faq = function() {
    $modal.open({
      templateUrl: '/app/partials/faq.html'
    });
  };

  $rootScope.donate = function() {
    $modal.open({
      templateUrl: '/app/partials/donate.html'
    });
  };

  $rootScope.login = function() {
    $modal.open({
      templateUrl: '/app/partials/login.html'
    });
  };

  $rootScope.logout = function() {
    auth.logout();
  };

  auth.loggedin(function(user) {
    $rootScope.loggedin = !!user;
  });

  $timeout(function() {
    if (!ipCookie('disclaimer')) {
      $modal.open({
        templateUrl: '/app/partials/disclaimer.html'
      });

      var now = new Date();
      ipCookie('disclaimer', Math.floor(now.getTime() / 1000), {expires: 365});
    }

    auth.check();
  });
});
