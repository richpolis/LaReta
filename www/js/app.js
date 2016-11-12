angular.module('laReta', [
    'ionic',
    'ui.router',
    'ngCordova',
    'laReta.controllers',
    'laReta.services',
    'laReta.filters',
    'uiGmapgoogle-maps',
    'google.places',
    'ngIOS9UIWebViewPatch'
])
    
    .run(function($http, $ionicPlatform, authService, $rootScope, $ionicPopup, $state, $ionicHistory, $ionicLoading,
                  jsonUtility, $cordovaNetwork, $ionicModal, $cordovaGeolocation, $cordovaPush) {


        // Check for auth
        if ( typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser()) ) {
            $state.go('app.login');
        }

        // Show Loader
        $rootScope.showLoader = function(enabled) {
            if(enabled) {
                $ionicLoading.show({
                    template: '<ion-spinner icon="android"></ion-spinner>',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 120,
                    showDelay: 0
                });
            } else {
                $ionicLoading.hide();
            }
        };

        // Error Handler
        $rootScope.error = function (text) {
            $ionicPopup.alert({
                title: 'Lo sentimos',
                template: text
            });
        };

        // Message Handler
        $rootScope.showMessage = function (text) {
            $ionicPopup.alert({
                title: 'La Reta',
                template: text
            });
        };

        // Force Logout
        $rootScope.forceLogout = function () {
            authService.setUser({});
            $state.go('app.login');
            $ionicHistory.nextViewOptions({disableBack: 'true'});
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        };

        // Privacy Modal Definition
        $ionicModal.fromTemplateUrl('templates/privacy-modal.html', {
            scope: $rootScope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $rootScope.privacyModal = modal;
        });
        $rootScope.openPrivacyModal = function() {
            $rootScope.privacyModal.show();
        };
        $rootScope.closePrivacyModal = function() {
            $rootScope.privacyModal.hide();
        };

        // Cordova Network - Listeners
        document.addEventListener("deviceready", function () {
            $rootScope.networkType = $cordovaNetwork.getNetwork();
            $rootScope.isOnline = $cordovaNetwork.isOnline();

            if(!$rootScope.isOnline) {
                $state.go('app.no-internet');
            }

            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
                $rootScope.isOnline = true;
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
                $rootScope.isOnline = false;
                $state.go('app.no-internet')
            });
        }, false);
        // End Cordova Network - Listeners

        // API Preset Error Definition
        $rootScope.getErrorDescription = function (code) {
            var description = '';
            switch (code) {
                case 0:
                    description = "La operación fue realizada con exito!";
                    break;
                case 1:
                    // Invalid HTTP Method
                    description = "#001 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 2:
                    // Invalid request content-type
                    description = "#002 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 3:
                    // Malformed request: Empty request body
                    description = "#003 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 4:
                    // Malformed request: Bad JSON
                    description = "#004 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 5:
                    // Malformed request: Missing Parameters
                    description = "#005 - Por favor llena todos los campos obligatorios y vuelve a intentarlo.";
                    break;
                case 6:
                    // Object requested was not found in database
                    description = "#006 - No se encontró lo que quieres ver, por favor intenta más tarde.";
                    break;
                case 7:
                    // Method disabled
                    description = "#007 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 8:
                    // Relation was not found in database
                    description = "#008 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 9:
                    // File not allowed
                    description = "#009 - El archivo no cumple con los requisitos, favor de intentar de nuevo.";
                    break;
                case 10:
                    // Authentication error, username not found in databse
                    description = "#010 - Usuario y/o contraseña incorrectos, por favor intenta de nuevo.";
                    break;
                case 11:
                    // Authentication error, please check username and password combination
                    description = "#011 - Usuario y/o contraseña incorrectos, por favor intenta de nuevo.";
                    break;
                case 12:
                    // Access forbidden
                    description = "#012 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 13:
                    // Authentication failed
                    description = "#013 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 14:
                    // Invalid email address provided
                    description = "#014 - El correo electrónico ingresado no tiene el formato correcto.";
                    break;
                case 15:
                    // Email address is already registered
                    description = "#015 - El correo electrónico ya esta registrado en la aplicación.";
                    break;
                case 16:
                    // User not found
                    description = "#016 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 17:
                    // Event not found
                    description = "#017 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 18:
                    // Sport code not found
                    description = "#018 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 19:
                    // Invalid datestamp format
                    description = "#019 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
                case 20:
                    // User has already joined the event
                    description = "#020 - Ya eres parte de esta reta!";
                    break;
                case 21:
                    // User has not joined the event
                    description = "#021 - No eres parte de esta reta!";
                    break;
                case 22:
                    // No messages found for event
                    description = "#022 - No hay mensajes que mostrar";
                    break;
                case 23:
                    // Message not found
                    description = "#023 - No se encontró el mensaje.";
                    break;
                case 25:
                    // User is not owner
                    description = "#025 - Únicamente el creador del evento puede eliminar una reta.";
                    break;
                case 27:
                    // Facebook didn't get right token
                    description = "#027 - Ha ocurrido un error con la autenticación por Facebook, por favor intenta más tarde.";
                    break;
                case 28:
                    // Facebook didn't get the info
                    description = "#028 - Ha ocurrido un error con la autenticación por Facebook, por favor intenta más tarde.";
                    break;
                default:
                    // Uknown internal error
                    description = "#099 - Ha ocurrido un error en la aplicación, por favor intenta más tarde.";
                    break;
            }

            return description;
        };

        // Sport Preset
        $rootScope.sports = [
            {
                "id": 1,
                "name": "Fútbol",
                "slug": "futbol",
                "image": "soccer.svg",
                "category": "Populares"
            },
            {
                "id": 2,
                "name": "Béisbol",
                "slug": "beisbol",
                "image": "baseball.svg",
                "category": "Populares"
            },
            {
                "id": 3,
                "name": "Softbol",
                "slug": "softbol",
                "image": "softball.svg",
                "category": "Populares"
            },
            {
                "id": 4,
                "name": "Básquetbol",
                "slug": "basquetbol",
                "image": "basketball.svg",
                "category": "Populares"
            },
            {
                "id": 5,
                "name": "Tenis",
                "slug": "tenis",
                "image": "tennis.svg",
                "category": "Populares"
            },
            {
                "id": 6,
                "name": "Fútbol Americano",
                "slug": "futbol americano",
                "image": "football.svg",
                "category": "Populares"
            },
            {
                "id": 7,
                "name": "Tochito",
                "slug": "tochito",
                "image": "flagfootball.svg",
                "category": "Populares"
            },
            {
                "id": 8,
                "name": "Golf",
                "slug": "golf",
                "image": "golf.svg",
                "category": "Populares"
            },
            {
                "id": 9,
                "name": "Atletismo",
                "slug": "atletismo",
                "image": "track.svg",
                "category": "Populares"
            },
            {
                "id": 10,
                "name": "Ciclismo",
                "slug": "ciclismo",
                "image": "cycling.svg",
                "category": "Populares"
            },
            {
                "id": 11,
                "name": "Voleibol",
                "slug": "voleibol",
                "image": "volleyball.svg",
                "category": "Populares"
            },
            {
                "id": 12,
                "name": "Crossfit",
                "slug": "crossfit",
                "image": "crossfit.svg",
                "category": "Gimnasio"
            },
            {
                "id": 13,
                "name": "Boliche",
                "slug": "boliche",
                "image": "bowling.svg",
                "category": "Populares"
            },
            {
                "id": 16,
                "name": "Box",
                "slug": "box",
                "image": "box.svg",
                "category": "Gimnasio"
            },
            {
                "id": 17,
                "name": "Yoga",
                "slug": "yoga",
                "image": "yoga.svg",
                "category": "Gimnasio"
            },
            {
                "id": 18,
                "name": "Gym",
                "slug": "gym",
                "image": "gym.svg",
                "category": "Gimnasio"
            },
            {
                "id": 19,
                "name": "Texas Hold'em",
                "slug": "texas hold em",
                "image": "texas.svg",
                "category": "De Mesa"
            },
            {
                "id": 20,
                "name": "Domino",
                "slug": "domino",
                "image": "domino.svg",
                "category": "De Mesa"
            },
            {
                "id": 21,
                "name": "Ajedrez",
                "slug": "ajedrez",
                "image": "chess.svg",
                "category": "De Mesa"
            },
            {
                "id": 22,
                "name": "Damas Inglesas",
                "slug": "damas inglesas",
                "image": "checkers.svg",
                "category": "De Mesa"
            },
            {
                "id": 23,
                "name": "Backgammon",
                "slug": "backgammon",
                "image": "backgammon.svg",
                "category": "De Mesa"
            },
            {
                "id": 24,
                "name": "Baccarat",
                "slug": "baccarat",
                "image": "baccarat.svg",
                "category": "De Mesa"
            },
            {
                "id": 25,
                "name": "Black Jack",
                "slug": "blackjack",
                "image": "blackjack.svg",
                "category": "De Mesa"
            },
            /*{
                "id": 14,
                "name": "Motocross",
                "slug": "motocross",
                "image": "motocross.svg",
                "category": ""
            },
            {
                "id": 15,
                "name": "Autos",
                "slug": "autos",
                "image": "cars.svg",
                "category": ""
            },
            {
                "id": 26,
                "name": "Lacrosse",
                "slug": "lacrosse",
                "image": "lacrosse.svg",
                "category": ""
            },
            {
                "id": 27,
                "name": "Bádminton",
                "slug": "badminton",
                "image": "badminton.svg",
                "category": ""
            },
            {
                "id": 28,
                "name": "Polo",
                "slug": "polo",
                "image": "polo.svg",
                "category": ""
            },
            {
                "id": 29,
                "name": "Patinaje",
                "slug": "patinaje",
                "image": "rollerblading.svg",
                "category": ""
            },
            {
                "id": 30,
                "name": "Patineta",
                "slug": "patineta",
                "image": "skateboarding.svg",
                "category": ""
            },
            {
                "id": 31,
                "name": "BMX",
                "slug": "bmx",
                "image": "bmx.svg",
                "category": ""
            },
            {
                "id": 32,
                "name": "Rugby",
                "slug": "rugby",
                "image": "rugby.svg",
                "category": ""
            },
            {
                "id": 33,
                "name": "Hockey",
                "slug": "hockey",
                "image": "hockey.svg",
                "category": ""
            },
            {
                "id": 34,
                "name": "Paintball",
                "slug": "paintball",
                "image": "paintball.svg",
                "category": ""
            },
            {
                "id": 35,
                "name": "Ping Pong",
                "slug": "ping pong",
                "image": "pingpong.svg",
                "category": ""
            },
            {
                "id": 36,
                "name": "Fut Golf",
                "slug": "fut golf",
                "image": "futgolf.svg",
                "category": ""
            },
            {
                "id": 37,
                "name": "Fut Tenis",
                "slug": "fut tenis",
                "image": "futtennis.svg",
                "category": ""
            },
            {
                "id": 38,
                "name": "Tiro con Arco",
                "slug": "tiro con arco",
                "image": "archery.svg",
                "category": ""
            },
            {
                "id": 39,
                "name": "Tiro con Dardos",
                "slug": "tiro con dardos",
                "image": "darts.svg",
                "category": ""
            },*/
            {
                "id": 40,
                "name": "Billar",
                "slug": "billar",
                "image": "pool.svg",
                "category": "Populares"
            },
            /*{
                "id": 41,
                "name": "Pesca",
                "slug": "pesca",
                "image": "fishing.svg",
                "category": ""
            },
            {
                "id": 42,
                "name": "Esgrima",
                "slug": "esgrima",
                "image": "fencing.svg",
                "category": ""
            },*/
            {
                "id": 99,
                "name": "Otros",
                "slug": "otros",
                "image": "others.svg",
                "category": "Otros"
            }
        ];

        $rootScope.skills = [
            { id: 0, label: 'Indiferente'},
            { id: 1, label: 'Principiante'},
            { id: 2, label: 'Intermedio'},
            { id: 3, label: 'Avanzado'},
            { id: 4, label: 'Experto'}
        ];

        $rootScope.eventGenders = [
            { id: 0, label: 'Mixto'},
            { id: 1, label: 'Hombres'},
            { id: 2, label: 'Mujeres'}
        ];

        $rootScope.userGenders = [
            { id: 0, label: 'No especificado'},
            { id: 1, label: 'Hombre'},
            { id: 2, label: 'Mujer'}
        ];

        $ionicPlatform.ready(function() {
            // Start GeoLocation
            // Initialize variables (Monterrey)
            // Default position if no GPS data was found
            $rootScope.lat = 25.67702;
            $rootScope.lng = -100.30890;

            document.addEventListener("deviceready", function () {
                var posOptions = {timeout: 10000, enableHighAccuracy: true};
                $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
                    $rootScope.lat  = position.coords.latitude;
                    $rootScope.lng = position.coords.longitude;
                }, function(err) {
                    // console.info('Returned a Geo error');
                });
            }, false);
            // End GeoLocation

            // Initialize Facebook ID and Token
            $rootScope.facebookId = false;
            $rootScope.facebookToken = false;
            
            // Identify platform
            $rootScope.isWebView = ionic.Platform.isWebView();
            $rootScope.isAndroid = ionic.Platform.isAndroid();
            $rootScope.isIOS = ionic.Platform.isIOS();

            $rootScope.devicePlatform = '';
            if ($rootScope.isAndroid) {
                $rootScope.devicePlatform = 'android';
            } else if ($rootScope.isIOS) {
                $rootScope.devicePlatform = 'ios';
            }

            // Configuration for push notifications
            $rootScope.deviceToken = '';

            var iosConfig = {
                "badge": true,
                "sound": true,
                "alert": true
            };

            var androidConfig = {
                "senderID": "692235903188"
            };

            if (window.cordova) {
                if ($rootScope.isIOS) {
                    $cordovaPush.register(iosConfig).then(function (deviceToken) {
                        // Success -- send deviceToken to server, and store for future use
                        $rootScope.deviceToken = deviceToken;
                    }, function (err) {
                        console.log("Registration error: " + err)
                    });

                    $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
                        if (notification.alert) {
                            navigator.notification.alert(notification.alert);
                        }

                        if (notification.sound) {
                            var snd = new Media(event.sound);
                            snd.play();
                        }

                        if (notification.badge) {
                            $cordovaPush.setBadgeNumber(notification.badge).then(function (result) {
                                // Success!
                            }, function (err) {
                                // An error occurred. Show a message to the user
                            });
                        }
                    });
                } else if ($rootScope.isAndroid) {

                    console.log("I tried to register push notification");
                    $cordovaPush.register(androidConfig).then(function (deviceToken) {
                        $rootScope.deviceToken = deviceToken;
                    }, function (err) {
                        // Error
                        console.log("Registration error: " + err)
                    });

                    $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
                        console.log("Had one of these:" + notification.event);
                        switch (notification.event) {
                            case 'registered':
                                if (notification.regid.length > 0) {
                                    $rootScope.deviceToken = notification.regid;
                                }
                                break;

                            case 'message':
                                // this is the actual push notification. its format depends on the data model from the push server
                                $rootScope.showMessage(notification.message);
                                break;

                            case 'error':
                                alert('GCM error = ' + notification.msg);
                                break;

                            default:
                                alert('An unknown GCM event has occurred');
                                break;
                        }
                    });
                }

            }
            // End push notifications


            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // For now, enable the keyboard accessories on iOS
                if (ionic.Platform.isIOS()) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                }

                // Ugly hotfix
                $rootScope.isIOS = ionic.Platform.isIOS();

                cordova.plugins.Keyboard.disableScroll(true);
            }

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.style(1);
            }

        });
    })

    .config(function($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider, uiGmapGoogleMapApiProvider,
    $cordovaFacebookProvider) {
        // Handle HTTP errors.
        $httpProvider.interceptors.push('responseObserver');

        /*
        // Disable JS Scrolling & use native scrolling
        //if(!ionic.Platform.isIOS())$ionicConfigProvider.scrolling.jsScrolling(false);
        $ionicConfigProvider.scrolling.jsScrolling(false);
        */

        // Disable "Swipe to go back"
        $ionicConfigProvider.views.swipeBackEnabled(false);

        /*
        // Disable transitions for iOS devices
        if(ionic.Platform.isIOS()) {
            $ionicConfigProvider.navBar.transition('none');
            $ionicConfigProvider.views.transition('none');
        }
        */

        // Google Maps configuration
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyDIOhJtXtMJ3qF5_KuPgwjT6-sdUFGEdfY',
            v: '3.20', //defaults to latest 3.X anyhow
            libraries: 'weather,geometry,visualization'
        });

        // Facebook configuration
        if(window.cordova && window.cordova.plugins) {
            var appID = 786521788124677;
            var version = "v2.3"; // or leave blank and default is v2.0
            $cordovaFacebookProvider.browserInit(appID, version);
        }
-
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl',
                data: {
                    requireLogin: true
                }
            })

            .state('app.login', {
                url: '/login',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/login.html',
                        controller: 'LoginCtrl'
                    }
                },
                data: {
                    requireLogin: false
                }
            })

            .state('app.signup', {
                cache: false,
                url: '/signup',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/signup.html',
                        controller: 'SignupCtrl'
                    }
                },
                data: {
                    requireLogin: false
                }
            })
            
            .state('app.contact', {
                url: '/contact',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/contact.html',
                        controller: 'ContactCtrl'
                    }
                },
                data: {
                    requireLogin: false
                }
            })

            .state('app.home', {
                url: '/home',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/home.html',
                        controller: 'HomeCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.sports', {
                url: '/sports',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/sports.html',
                        controller: 'SportsCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.events', {
                cache: false,
                url: '/events/:sportId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/events.html',
                        controller: 'EventsCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.event-new', {
                cache: false,
                url: '/event/new',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/new-event.html',
                        controller: 'NewEventCtrl'
                    }
                },
                params : {
                    defaultSport : null
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.event-view', {
                cache: false,
                url: '/event/view/:eventId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/event.html',
                        controller: 'EventCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.event-participants', {
                cache: false,
                url: '/event/participants/:eventId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/event-participants.html',
                        controller: 'EventParticipantsCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.event-message-board', {
                cache: false,
                url: '/event/message/:eventId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/event-message-board.html',
                        controller: 'EventMessageBoardCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.event-user', {
                url: '/event/user',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/events-user.html',
                        controller: 'EventsUserCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })


            .state('app.profile-self', {
                cache: false,
                url: '/profile',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/profile.html',
                        controller: 'ProfileSelfCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.profile-view', {
                cache: false,
                url: '/profile/view/:userId',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/profile.html',
                        controller: 'ProfileViewCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.profile-edit', {
                cache: false,
                url: '/profile-edit',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/edit-profile.html',
                        controller: 'ProfileSelfCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            })

            .state('app.no-internet', {
                cache: true,
                url: '/no-internet',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/no-internet.html',
                        controller: 'NoInternetCtrl'
                    }
                },
                data: {
                    requireLogin: false
                }
            })

            .state('app.logout', {
                url: '/logout',
                views: {
                    'menuContent': {
                        controller: 'LogoutCtrl'
                    }
                },
                data: {
                    requireLogin: true
                }
            });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('app/home');
    });
