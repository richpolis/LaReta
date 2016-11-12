angular.module('laReta.services', [])

    .service("apiHandler", function($http, $q, authService) {

        this.executeRequest = function (url, data) {

            var baseUrl = 'http://api.laretaapp.com';
            var deferred = $q.defer();

            $http({
                method: 'POST',
                data: data || {},
                dataType: 'json',
                url: baseUrl + url,
                headers: {
                    'content-type': 'application/json',
                    'x-authorization': authService.getApiKey()
                }
            }).success(function(data) {
                deferred.resolve(data);
            }).error(function(data, status) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

        // Signup
        this.signup = function (data) {
            return this.executeRequest('/user/signup', data);
        };

        // User View
        this.viewUser = function (data) {

            var sufix = "";
            if (typeof data != 'undefined' && typeof data.userId != 'undefined') {
                suffix = "/" + data.userId;
            } else {
                suffix = "";
            }
            return this.executeRequest('/user/view' + suffix);
        };

        // User Edit
        this.editUser = function (data) {
            return this.executeRequest('/user/edit', data);
        };

        // User Edit
        this.updateImage = function (data) {
            return this.executeRequest('/user/image/update', data);
        };

        // Event List
        this.listEvents = function (data) {
            return this.executeRequest('/event/list', data);
        };

        // Event List
        this.listEventsUser = function (data) {
            return this.executeRequest('/event/user', data);
        };

        // Event View
        this.viewEvent = function (data) {
            return this.executeRequest('/event/view/' + data["id"], data);
        };

        // Event New
        this.newEvent = function (data) {
            return this.executeRequest('/event/new', data);
        };

        // Event Edit
        this.editEvent = function (data) {
            return this.executeRequest('/event/edit', data);
        };

        // Event Join
        this.joinEvent = function (data) {
            return this.executeRequest('/event/join', data);
        };

        // Event Cancel
        this.cancelEvent = function (data) {
            return this.executeRequest('/event/cancel', data);
        };

        // Event Delete
        this.deleteEvent = function (data) {
            return this.executeRequest('/event/delete', data);
        };

        // Event Participants
        this.viewEventParticipants = function (data) {
            return this.executeRequest('/event/participants/' + data["id"], data);
        };

        //  Message List
        this.listMessage = function (data) {
            return this.executeRequest('/message/list', data);
        };

        // Message New
        this.newMessage = function (data) {
            return this.executeRequest('/message/new', data)
        };

        // Message Delete
        this.deleteMessage = function (data) {
            return this.executeRequest('/message/delete', data);
        }
    })

    .factory('authService', function($http, $q, $log, $state, $timeout, $localstorage) {
        var obj =  {};
        obj.user = {};

        obj.setUser = function (user) {
            obj.user = {};
            obj.user = user;
            $localstorage.set('user', user, true);
            return obj.user;
        };

        obj.getUser = function () {
            return obj.user;
        };

        obj.getApiKey = function () {
            return (typeof obj.user === "undefined" ? '' : obj.user.apiKey) || '';
        };

        obj.executeRequest = function (url, data) {
            var baseUrl = 'http://api.laretaapp.com';
            var deferred = $q.defer();
            var endpoint = baseUrl + url;

            console.log("Endpoint: " + endpoint);
            console.log("Data:");
            console.log(JSON.stringify(data));

            $http({
                method: 'POST',
                data: data || {},
                dataType: 'json',
                url: endpoint,
                headers: {
                    'content-type': 'application/json',
                    'x-authorization': (typeof obj.user != "undefined" ? obj.user.apiKey : '') || ''
                }
            }).success(function(data) {
                deferred.resolve(data);
            }).error(function(data, status) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

        obj.login = function (data) {
            return obj.executeRequest('/security/login', data);
        };

        obj.check = function (data) {
            return obj.executeRequest('/security/check', data);
        };

        obj.logout = function () {
            return obj.executeRequest('/security/logout')
        };

        obj.init = function () {
            obj.user = $localstorage.get('user', {}, true);
        };

        obj.init();
        return obj;
    })



    .factory('$localstorage', ['$window', function ($window) {
        return {
            set: function(key, value, isJson) {
                if (typeof isJson === 'undefined') { isJson = false; }
                if(isJson) { value = JSON.stringify(value); }
                if (typeof $window.localStorage != "undefined") {
                    $window.localStorage[key] = value;
                } else {
                    $window.sessionStorage[key] = value;
                }

            },
            get: function(key, defaultValue, isJson) {
                if (typeof isJson === 'undefined') { isJson = false; }
                if (isJson) {
                    if (typeof $window.localStorage != "undefined") {
                        return JSON.parse($window.localStorage[key] || '{}');
                    } else {
                        return JSON.parse($window.sessionStorage[key] || '{}');
                    }
                } else {
                    if (typeof $window.localStorage != "undefined") {
                        return $window.localStorage[key] || defaultValue;
                    } else {
                        return $window.sessionStorage[key] || defaultValue;
                    }

                }
            }
        }
    }])

    .factory('responseObserver', function responseObserver($q, $window, $rootScope) {
        return {
            // optional method
            'request': function(config) {
                $rootScope.showLoader(true);
                return config;
            },
            // optional method
            'requestError': function(rejection) {
                // do something on error
                return $q.reject(rejection);
            },
            // optional method
            'response': function(response) {
                $rootScope.showLoader(false);
                return response;
            },
            // optional method
            'responseError': function(rejection) {
                // do something on error
                switch (rejection.status) {
                    case 403:
                        $rootScope.error('Tu sesión ha expirado, favor de inciar sesión de nuevo.');
                        $rootScope.showLoader(false);
                        $rootScope.forceLogout();
                        break;
                    case 500:
                        $rootScope.error('Ocurrió un error en el servidor, favor de intentar más tarde.');
                        $rootScope.showLoader(false);
                        break;
                    default:
                        $rootScope.error('Ocurrió un error en la conexión, favor de intentar más tarde. [' + rejection.status + ']');
                        $rootScope.showLoader(false);
                        break;
                }
                return $q.reject(rejection);
            }
        };
    })

    .factory('jsonUtility', function () {
        return {
            isObjectEmpty: function(obj) {
                // null and undefined are "empty"
                if (obj == null) return true;

                // Otherwise, does it have any properties of its own?
                // Note that this doesn't handle
                // toString and valueOf enumeration bugs in IE < 9
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) return false;
                }
                return true;
            }
        }
    })

    .factory('dateUtility', function () {
        return {
            monthName: function(m) {
                var month = new Array();
                month[0] = "Ene";
                month[1] = "Feb";
                month[2] = "Mar";
                month[3] = "Abr";
                month[4] = "May";
                month[5] = "Jun";
                month[6] = "Jul";
                month[7] = "Ago";
                month[8] = "Sep";
                month[9] = "Oct";
                month[10] = "Nov";
                month[11] = "Dic";

                if (m >= 0 && m <= 11) {
                    return month[m];
                }
                return '??';
            },
            dayName: function(d) {
                var day = new Array();
                day[0] = 'Do';
                day[1] = 'Lu';
                day[2] = 'Ma';
                day[3] = 'Mi';
                day[4] = 'Ju';
                day[5] = 'Vi';
                day[6] = 'Sa';

                if (d >= 0 && d <= 6) {
                    return day[d];
                }
                return '??';
            }
        }
    })

    .factory("facebookHandler", function($http, $q) {
        var obj =  {};
        obj.user = {};

        obj.setUser = function (facebookId, facebookToken) {
            obj.user.facebookId = facebookId;
            obj.user.facebookToken = facebookToken;
            return obj.user;
        };

        obj.getUser = function () {
            return obj.user;
        };

        obj.clear = function () {
            obj.user = {};
            return obj.user;
        };

        obj.me = function (authToken) {

            var baseUrl = 'https://graph.facebook.com/v2.5/me?fields=birthday%2Cgender%2Cemail%2Cbio%2Cname' +
                '&access_token=' + authToken +
                '&format=json&method=get&pretty=0&suppress_http_code=1';
            var deferred = $q.defer();

            console.log("Endpoint: " + baseUrl);
            console.log("API Token: " + authToken);

            $http({
                method: 'GET',
                dataType: 'json',
                url: baseUrl,
                headers: {
                    'content-type': 'application/json'
                }
            }).success(function(data) {
                deferred.resolve(data);
            }).error(function(data, status) {
                deferred.reject(data);
            });

            return deferred.promise;
        };

        return obj;
    });
