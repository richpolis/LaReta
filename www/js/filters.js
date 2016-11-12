angular.module('laReta.filters', [])
    .filter('isObjectEmpty', function(obj) {
        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and valueOf enumeration bugs in IE < 9
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) return false;
        }

        return true;
    })
    .filter('range', function() {
        return function(input, lowerLimit, upperLimit) {
            lowerLimit = parseInt(lowerLimit);
            upperLimit = parseInt(upperLimit);

            for (var i = lowerLimit; i <= upperLimit; i++) {
                input.push(i);
            }

            return input;
        };
    })
    .filter('capitalize', function() {
        return function(input) {
            return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
        }
    })
    .filter('compactDate', function(dateUtility) {
        return function(input) {
            var date = new Date(input*1000);
            var da = dateUtility.dayName(date.getDay());
            var dd = date.getDate();
            var mm = dateUtility.monthName(date.getMonth());
            var y = date.getFullYear();

            // Assign it to the master scope
            var formatted = da + ' ' + dd + '/'+ mm /*+ '/'+ y*/;
            return formatted;
        }
    })
;