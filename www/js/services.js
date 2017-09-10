angular.module('laReta.services', [])
    .service("apiHandler", function($http, $q, authService) {

        this.executeRequest = function (url, data) {

            //var baseUrl = 'http://api.laretaapp.com';
            //var baseUrl = 'http://localhost:8023/app_dev.php';
            var baseUrl ='https://pacific-ridge-59514.herokuapp.com';
            var endpoint = baseUrl + url;
            var deferred = $q.defer();

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

        // Event List
        this.listUsersHasCanchas = function (data) {
            return this.executeRequest('/user/list/admin', data);
        };

        // User Edit
        this.editUser = function (data) {
            return this.executeRequest('/user/edit', data);
        };

        // User Edit
        this.updateImage = function (data) {
            return this.executeRequest('/user/image/update', data);
        };

        // User Edit
        this.updateGeolocation = function (data) {
            return this.executeRequest('/user/geolocation/update', data);
        };

        // User Permisos
        this.updateRole = function (data) {
            return this.executeRequest('/user/role/update', data);
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
        };
        
        //  Cancha List
        this.listCancha = function (data) {
            return this.executeRequest('/canchas/list', data);
        };

        //  Cancha List for Admin
        this.listAdminCancha = function (data) {
            return this.executeRequest('/canchas/list/admin', data);
        };
        
        //  Cancha View
        this.viewCancha = function (data) {
            return this.executeRequest('/canchas/view', data);
        };

        // Cancha New
        this.newCancha = function (data) {
            return this.executeRequest('/canchas/new', data);
        };
        
        // Cancha Edit
        this.editCancha = function (data) {
            return this.executeRequest('/canchas/edit', data);
        };

        // Cancha Delete
        this.deleteCancha = function (data) {
            return this.executeRequest('/canchas/delete', data);
        };

        //  Reservaciones List <CalendarioCancha>
        this.listReservacionesForUser = function (data) {
            return this.executeRequest('/calendario/canchas/list/user', data);
        };

        //  Reservaciones List <CalendarioCancha>
        this.listReservacionesForCancha = function (data) {
            return this.executeRequest('/calendario/canchas/list/cancha', data);
        };

        //  Reservaciones View <CalendarioCancha>
         this.viewReservacion = function (data) {
            return this.executeRequest('/calendario/canchas/view', data);
        };

        // Reservaciones New <CalendarioCancha>
        this.newReservacion = function (data) {
            return this.executeRequest('/calendario/canchas/new', data);
        };

        // Reservaciones Edit <CalendarioCancha>
        this.editReservacion = function (data) {
            return this.executeRequest('/calendario/canchas/edit', data);
        };

        // Reservaciones Delete <CalendarioCancha>
        this.deleteReservacion = function (data) {
            return this.executeRequest('/calendario/canchas/delete', data);
        };

        // Reservaciones Pago <CalendarioCancha>
        this.pagoReservacion = function (data) {
            return this.executeRequest('/calendario/canchas/pago', data);
        };

    })
    .factory('authService', function($http, $q, $log, $state, $timeout, $localStorage) {
        var obj =  {};
        obj.user = {};

        obj.setUser = function (user) {
            obj.user = {};
            obj.user = user;
            $localStorage.set('user', user, true);
            return obj.user;
        };

        obj.getUser = function () {
            return obj.user;
        };

        obj.getApiKey = function () {
            return (typeof obj.user === "undefined" ? '' : obj.user.apiKey) || '';
        };

        obj.executeRequest = function (url, data) {
            //var baseUrl = 'http://api.laretaapp.com';
            //var baseUrl = 'http://localhost:8023/app_dev.php';
            var baseUrl ='https://pacific-ridge-59514.herokuapp.com';
            
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

        obj.recoverPassword = function(data){
            return obj.executeRequest('/user/recover/password', data);
        };

        obj.logout = function () {
            return obj.executeRequest('/security/logout')
        };

        obj.changePassword = function(data){
            return obj.executeRequest('/user/change/password',data);
        };

        obj.confirmEmail = function(data){
            return obj.executeRequest('/user/confirm/email',data);
        };

        obj.init = function () {
            obj.user = $localStorage.get('user', {}, true);
        };

        obj.init();
        return obj;
    })
    
    .factory('$localStorage', ['$window', function ($window) {
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

    .factory('responseObserver', ['$q','$rootScope', function responseObserver($q, $rootScope) {
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
    }])

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

    .factory('dateUtility', function ($rootScope) {
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
            },
            getDateFromString: function(date, separador){
                separador = separador || "-";
                if($rootScope.isIOS){
                    return date;
                }else{
                    var datos = date.split(separador);
                    var fecha = new Date(datos[0],datos[1],datos[2]);
                    return fecha; 
                }
            },
            getStringFromDate: function(date, separador, mysql){
                separador = separador || "\/";
                mysql = mysql || false;
                if($rootScope.isIOS){
                    return date;
                }else{
                    var ano = parseInt(date.getFullYear(),10);
                    var mes = parseInt(date.getMonth(),10) + 1;
                    var dia = parseInt(date.getDate(),10);
                    var string = "";
                    if(mysql){
                        string = ano + separador + (mes>=10?mes:"0" + mes)  + separador + (dia>=10?dia:"0" + dia);
                    }else{
                        string = (dia>=10?dia:"0" + dia) + separador + (mes>=10?mes:"0" + mes) + separador + ano;
                    }
                    return string;
                }
            },
            getStringFromTime: function(time){
                if($rootScope.isIOS){
                    return time;
                }else{
                    var horas = parseInt(time.getHours(),10);
                    var minutos = parseInt(time.getMinutes(),10);
                    var string = '';
                    if(horas >= 12 && horas <= 23){
                        horas = (horas == 12?horas: horas - 12);
                        string = (horas>=10?horas:"0" + horas) + ":" + (minutos>=10?minutos:"0" + minutos) + " pm";
                    }else{
                        string = (horas>=10?horas:"0" + horas) + ":" + (minutos>=10?minutos:"0" + minutos) + " am";    
                    }
                    return string; 
                }
            },
            getStringFromDateTime: function(datetime){
                return datetime.getFullYear()
                + '-' + ((datetime.getMonth() + 1) < 10 ? '0':'') + (datetime.getMonth() + 1)
                + '-' + (datetime.getDate() < 10 ? '0':'') + datetime.getDate()
                + ' ' + (datetime.getHours()  < 10 ? '0':'') + datetime.getHours()
                + ':' + (datetime.getMinutes() < 10 ? '0':'') + datetime.getMinutes()
                + ":00";
            }
        }
    })

    .factory("facebookHandler", function($http, $q, $localStorage) {
        var obj =  {};
        obj.user = {};

        obj.setUser = function (facebookId, facebookToken) {
            obj.user.facebookId = facebookId;
            obj.user.facebookToken = facebookToken;
            $localStorage.set('userFacebook', obj.user, true);
            return obj.user;
        };

        obj.setUserImageFacebook = function(url){
            this.getUser();
            obj.user.image = url;
            $localStorage.set('userFacebook',obj.user,true);    
        };

        obj.getUser = function () {
            obj.user = $localStorage.get('userFacebook', {}, true);
            return obj.user;
        };

        obj.clear = function () {
            obj.user = {};
            $localStorage.set('userFacebook', obj.user, true);
            return obj.user;
        };

        obj.me = function (authToken) {

            var baseUrl = 'https://graph.facebook.com/v2.5/me?fields=birthday%2Cgender%2Cbio%2Cemail%2Cname%2Cpicture.width%28300%29.height%28300%29' +
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

        obj.meFeed = function (params, authToken) {

            var baseUrl = 'https://graph.facebook.com/v2.5/me/feed?' +
                'access_token=' + authToken +
                '&format=json&method=post&pretty=0&suppress_http_code=1';
            var deferred = $q.defer();

            console.log("Endpoint: " + baseUrl);
            console.log("API Token: " + authToken);

            $http({
                method: 'POST',
                dataType: 'json',
                data: params,
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
