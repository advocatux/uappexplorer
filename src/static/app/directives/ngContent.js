'use strict';

//From http://stackoverflow.com/a/19802130
app.directive('ngContent', function() {
  return {
    link: function($scope, $element, $attrs) {
      $scope.$watch($attrs.ngContent, function(value) {
        $element.attr('content', value);
      });
    }
  };
});
