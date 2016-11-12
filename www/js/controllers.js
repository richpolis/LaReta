angular.module('laReta.controllers', [])

    .controller('AppCtrl', function($scope) {
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        // Form data for the login modal
        $scope.loginData = {};
    })

    .controller('LoginCtrl', function ($rootScope, $scope, $timeout, $log, $state, authService, $ionicHistory,
                                       $cordovaFacebook, facebookHandler) {
        $scope.loginData = {
            'devicePlatform':  $rootScope.devicePlatform,
            'deviceToken': $rootScope.deviceToken
        };

        // Login function
        $scope.doLogin = function (data) {
            var promise = authService.login($scope.loginData);
            promise.then(function(result) {

                if (result.error == 26) {
                    $state.go('app.signup');
                } else if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    authService.setUser(result.data);
                    $state.go('app.home'); // Default screen after login
                    $ionicHistory.nextViewOptions({disableBack: 'true'});
                    $ionicHistory.clearHistory();
                    $ionicHistory.clearCache();
                }
            });
        };
        // END login function

        // GoTo Sign Up
        $scope.goToSignUp = function () {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $state.go('app.signup');
        };
        // END Sign Up function

        // Facebook Login
        $scope.facebookLogin = function () {
            // Business Logic
            $cordovaFacebook.login(["public_profile", "email", "user_birthday", "user_about_me"]).then(function(response) {
                console.log(JSON.stringify(response));
                if (response.hasOwnProperty('authResponse')) {
                    $scope.loginData.facebookId = response.authResponse.userID;
                    //facebookHandler.setUser(response.authResponse.userID,response.authResponse.accessToken);
                    $rootScope.facebookId = response.authResponse.userID;
                    $rootScope.facebookToken = response.authResponse.accessToken;

                    $scope.doLogin($scope.loginData);
                }else{
                    $rootScope.error(
                        $rootScope.getErrorDescription(26)
                    );
                }
            }, function (error) {
                console.log(error);
                $rootScope.error(
                    $rootScope.getErrorDescription(26)
                );
            });
        };
        // End facebook login
    })

    .controller('SignupCtrl', function($scope, apiHandler, $state, $filter, $rootScope, $ionicPopup, $ionicHistory,
                                       $cordovaFacebook, facebookHandler, $stateParams, authService, jsonUtility) {
        // Initialize variables
        $scope.user = {};
        $scope.user.gender = 0;
        $scope.facebookConnected = false;
        $scope.facebookHasEmail = false;

        // Preset for gender
        $scope.genderOptions = $rootScope.userGenders;

        // Preset for Sports (sort by Name)
        $scope.sportOptions = $rootScope.sports;
        $scope.sportOptions.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        // Check for parameters
        if ( $rootScope.facebookId && $rootScope.facebookToken ) {
            $scope.user.facebookId = $rootScope.facebookId;
            $scope.user.facebookToken  = $rootScope.facebookToken;
            $scope.user.password  = $rootScope.facebookToken;

            var promise = facebookHandler.me($scope.user.facebookToken);

            promise.then(function(apiResponse) {
                console.log(JSON.stringify(apiResponse));

                if (!apiResponse.hasOwnProperty('email')) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(28)
                    );
                }

                if (apiResponse.hasOwnProperty('birthday')) {
                    $scope.user.date =  new Date(Date.parse(apiResponse.birthday));
                }

                if (apiResponse.hasOwnProperty('gender')) {
                    if (apiResponse.gender == 'male') {
                        $scope.user.gender = 1;
                    }else if (apiResponse.gender == 'female') {
                        $scope.user.gender = 2;
                    }else{
                        $scope.user.gender = 0;
                    }
                }

                if (apiResponse.hasOwnProperty('email')) {
                    $scope.user.email = apiResponse.email;
                    $scope.facebookHasEmail = true;
                }

                if (apiResponse.hasOwnProperty('name')) {
                    $scope.user.fullName = apiResponse.name;
                }

                if (apiResponse.hasOwnProperty('bio')) {
                    $scope.user.bio = apiResponse.bio;
                }

                $scope.facebookConnected = true;
            });
        }

        // Facebook Signup
        $scope.facebookSignup = function () {
            // Business Logic
            $cordovaFacebook.login(["public_profile", "email", "user_birthday", "user_about_me"]).then(function(response) {

                $scope.user.facebookId = response.authResponse.userID;
                $scope.user.facebookToken  = response.authResponse.accessToken;
                $scope.user.password  = response.authResponse.accessToken;

                var promise = facebookHandler.me($scope.user.facebookToken);

                promise.then(function(apiResponse) {
                    console.log(JSON.stringify(apiResponse));

                    if (apiResponse.hasOwnProperty('birthday')) {
                        $scope.user.date =  new Date(Date.parse(apiResponse.birthday));
                    }

                    if (apiResponse.hasOwnProperty('gender')) {
                        if (apiResponse.gender == 'male') {
                           $scope.user.gender = 1;
                        }else if (apiResponse.gender == 'female') {
                            $scope.user.gender = 2;
                        }else{
                            $scope.user.gender = 0;
                        }
                    }

                    if (apiResponse.hasOwnProperty('email')) {
                        $scope.user.email = apiResponse.email;
                        $scope.facebookHasEmail = true;
                    }

                    if (apiResponse.hasOwnProperty('name')) {
                        $scope.user.fullName = apiResponse.name;
                    }

                    if (apiResponse.hasOwnProperty('bio')) {
                        $scope.user.bio = apiResponse.bio;
                    }

                    $scope.facebookConnected = true;
                });

            }, function (error) {
                console.log(error);
            });

        };
        // End facebook signup

        // Do Signup
        $scope.doSignup = function (data) {
            // Process date
            if($scope.user.date != "undefined" && $scope.user.date instanceof Date) {
                $scope.user.birthDateYear = $scope.user.date.getFullYear();
                $scope.user.birthDateMonth = $scope.user.date.getMonth() + 1;
                $scope.user.birthDateDay = $scope.user.date.getDate();
            }

            var promise = apiHandler.signup($scope.user);
            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {

                    // Sign up successful
                    var loginPromise = authService.login($scope.user);
                    loginPromise.then(function(loginResult) {

                        if (result.error != 0) {
                            $rootScope.error(
                                $rootScope.getErrorDescription(loginResult.error)
                            );
                        } else {
                            authService.setUser(loginResult.data);
                            $scope.user = {};
                            $scope.facebookConnected = false;
                            facebookHandler.clear();
                            $state.go('app.home'); // Default screen after login
                            $ionicHistory.nextViewOptions({disableBack: 'true'});
                            $ionicHistory.clearHistory();
                            $ionicHistory.clearCache();
                        }
                    });
                }
            });
        };
        // END Do Signup function

        $scope.cancelSignUp = function() {
            $scope.user = {};
            $scope.facebookConnected = false;
            $scope.user.facebookId = null;
            $rootScope.facebookToken = null;
            facebookHandler.clear();
            $state.go('app.login'); // Default screen after login
            $ionicHistory.nextViewOptions({disableBack: 'true'});
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        };
    })

    .controller('LogoutCtrl', function($scope, authService, $state, $ionicHistory) {
        var promise = authService.logout();
        promise.then(function(data) {
            if (data.error == 0) {
                authService.setUser({});
                $state.go('app.login');
                $ionicHistory.nextViewOptions({disableBack: 'true'});
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
            }
        });
    })

    .controller('ContactCtrl', function($scope) {
        $scope.sendEmail = function() {
            window.location.replace('mailto:info@laretaapp.com');
        };

        $scope.callPhone = function() {
            window.location.replace('tel:8110503445');
        };
    })

    .controller('HomeCtrl', function($scope, $state, $ionicHistory, authService, jsonUtility) {
        // Check for auth
        if ( typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser()) ) {
            $state.go('app.login');
        }

        $scope.findEvent = function() {
            $state.go('app.sports');
            /* Fix 19-01-2016: for some reason, they DO want to be able to go back to this screen. This was not the original funcionality.
            $ionicHistory.nextViewOptions({disableBack: 'true'});
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            */
        };
        $scope.newEvent = function() {
            $state.go('app.event-new');
            /* Fix 19-01-2016: for some reason, they DO want to be able to go back to this screen. This was not the original funcionality.
            $ionicHistory.nextViewOptions({disableBack: 'true'});
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            */
        };
    })

    .controller('ProfileSelfCtrl', function($scope, apiHandler, $state, $rootScope, $cordovaCamera) {
        // Initialize user
        $scope.user = {};
        $scope.imageData = {};

        var promise = apiHandler.viewUser();

        promise.then(function (response) {
            console.log(response);
            if (response.error != 0) {
                // Error Handling
            }else{
                $scope.user = response.data;

                if($scope.user.birthDate) {
                    // Explode birthDate
                    var dateArr = $scope.user.birthDate.split("-");
                    $scope.user.birthDateDay = parseInt(dateArr[2]);
                    $scope.user.birthDateMonth = parseInt(dateArr[1]);
                    $scope.user.birthDateYear = parseInt(dateArr[0]);
                    $scope.user.date = new Date($scope.user.birthDateYear, ($scope.user.birthDateMonth-1), $scope.user.birthDateDay)
                    console.log($scope.user.date);
                }
            }
        });

        // Preset for gender
        $scope.genderOptions = $rootScope.userGenders;

        // Preset for Sports
        $scope.sportOptions = $rootScope.sports;
        $scope.sportOptions.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        // GoTo Edit Profile
        $scope.goToEditProfile = function () {
            $state.go('app.profile-edit');
        };
        // END Edit Profile function

        // Save Profile
        $scope.saveProfile = function (data) {
            // Process date
            if($scope.user.date != "undefined" && $scope.user.date instanceof Date) {
                $scope.user.birthDateYear = $scope.user.date.getFullYear();
                $scope.user.birthDateMonth = $scope.user.date.getMonth() + 1;
                $scope.user.birthDateDay = $scope.user.date.getDate();
            }else{
                $scope.user.birthDateYear = '';
                $scope.user.birthDateMonth = '';
                $scope.user.birthDateDay = '';
            }

            var promise = apiHandler.editUser($scope.user);

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                $scope.user = response.data;
                $state.go('app.profile-self');
            });
            
        };
        // END Save Profile function


        // Get Picture
        $scope.editProfilePicture = function () {
            document.addEventListener("deviceready", function () {

                var options = {
                    quality: 80,
                    destinationType: Camera.DestinationType.DATA_URL,
                    cameraDirection: Camera.Direction.FRONT,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: true,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: 800,
                    targetHeight: 1200,
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false,
                    correctOrientation:true
                };

                $cordovaCamera.getPicture(options).then(function(imageData) {
                    /*
                    var image = document.getElementById('profilePicture');
                    image.src = "data:image/jpeg;base64," + imageData;
                    */
                    $scope.user.image = imageData;
                    $scope.imageData.image = imageData;

                    // Save picture on
                    var promise = apiHandler.updateImage($scope.imageData);

                    promise.then(function (response) {
                        console.log("Response:");
                        console.log(response);
                    });


                }, function(err) {
                    // error
                });

            }, false);
        };
        // End Get Picture
    })

    .controller('NoInternetCtrl', function($scope, $state, $ionicHistory) {
        $scope.goBack = function ()  {
            $ionicHistory.goBack();
        };
    })

    .controller('ProfileViewCtrl', function($scope, $stateParams, apiHandler) {

        var userId = $stateParams["userId"];

        var data = {"userId": userId};

        var promise = apiHandler.viewUser(data);

        promise.then(function (response) {
            console.log(response);
            if (response.error != 0) {
                // Error Handling
            } else {
                $scope.user = response.data;
            }
        });
    })

    .controller('SportsCtrl', function($rootScope, $scope, $state) {
        $scope.categories = sportsByCategory($rootScope.sports);
        $scope.searching = false;

        $scope.filterSports = function(text) {
            if (text) {
                text = text.toLowerCase();
                var filteredSports = [];

                angular.forEach($rootScope.sports, function(value){
                    if (value.slug.indexOf(text) > -1 && value.category !== '') { // temporary fix to hide sports without category
                        // it exists, add this to the array
                        filteredSports.push(value);
                    }
                });

                $scope.categories = {"searchResults": filteredSports};
                $scope.searching = true;
            } else {
                // no text was inputted, show all
                $scope.categories = sportsByCategory($rootScope.sports);
                $scope.searching = false;
            }
        };

        $scope.viewAll = function() {
            $state.go('app.events', { 'sportId': 0 });
        };

        function sportsByCategory(sports) {
            // Bugfix: sort the array
            var list = {'Populares': [], 'Gimnasio': [], 'De Mesa': [], 'Otros': []};

            angular.forEach(sports, function(sport) {
                if (sport.category !== '') {
                    list[sport.category].push(sport);
                }
            });

            console.log(list);
            return list;
        }
    })

    .controller('EventsCtrl', function($rootScope, $scope, $state, $location, $stateParams, apiHandler, dateUtility) {
        var sport = {};

        angular.forEach($rootScope.sports, function(value, key) {
            if ($stateParams.sportId == value["id"]) {
                sport = value;
            }
        });

        // If no sport found, default to all
        if (sport.id === undefined) {
            sport.id = 0;
        }

        $scope.sport = sport;

        // Load the sport list from the API
        var data = {};
        data.sport = sport.id;
        data.latitude = $rootScope.lat;
        data.longitude =  $rootScope.lng;
        data.date = 0; // default to 0 (today)

        // Prepare the date list
        $scope.dates = {
            0: 'Cualquier día',
            1: 'Hoy',
            2: 'Mañana',
            3: 'Pasado mañana'
        };

        for (n = 4; n < 15; n++) {
            // Calculate the date in n days
            var future = new Date();
            future.setDate(future.getDate() + n);

            // Format it pretty
            var da = dateUtility.dayName(future.getDay());
            var dd = future.getDate();
            var mm = dateUtility.monthName(future.getMonth());
            var y = future.getFullYear();

            // Assign it to the master scope
            $scope.dates[n] = da + ' ' + dd + '/'+ mm + '/'+ y;
        }

        $scope.datePicker = 0;
        $scope.datePickerVisible = false;

        var promise = apiHandler.listEvents(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            if (response.error != 0) {
                // Error Handling
            } else {
                $scope.events = response.data;
            }
        });

        // Prepare the GoToEvent links
        $scope.goToEvent = function(id) {
            $state.go('app.event-view', { 'eventId': id });
        };
        // END GoToEvent

        // GoTo Create Event
        $scope.goToCreateEvent = function (sportId) {
            $state.go('app.event-new', {'defaultSport': sportId});
        };
        // END Create Event function

/*        $scope.toggleDateBox = function () {
            var b = document.getElementById('datebox');
            //if (!$scope.datePickerVisible) {
                b.style.height = '50px';
            //} else {
                // never hide it
                //b.style.height = '0';
            //}

            //$scope.datePickerVisible = !$scope.datePickerVisible;
        };*/

        $scope.updateDate = function (datePicker) {
            console.log('New date: ' + datePicker);

            // Update request data
            data.date = datePicker;

            var promise = apiHandler.listEvents(data);

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                if (response.error != 0) {
                    // Error Handling
                } else {
                    $scope.events = response.data;

                    // Hide the date box
                    // var b = document.getElementById('datebox').style.height ='0';
                }
            });
        }
    })

    .controller('EventsUserCtrl', function($rootScope, $scope, $state, $location, $stateParams, apiHandler) {
        // Load the sport list from the API
        var data = {};

        data.latitude = $rootScope.lat;
        data.longitude =  $rootScope.lng;

        var promise = apiHandler.listEventsUser(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            $scope.upcoming = response.data.upcoming;
            $scope.past = response.data.past;
        });

        // Prepare the GoToEvent links
        $scope.goToEvent = function(id) {
            $state.go('app.event-view', { 'eventId': id });
        };

        // GoTo Create Event
        $scope.goToCreateEvent = function () {
            $state.go('app.event-new');
        };
        // END Creagte Event function
    })

    .controller('NewEventCtrl', function($rootScope, $scope, $location, $stateParams, apiHandler, $state, $ionicHistory, uiGmapGoogleMapApi, $ionicModal) {
        // Needed variables
        $scope.event = {};
        $scope.event.skill = 0;
        $scope.event.gender = 0;

        // Preset Sport
        if ($stateParams.defaultSport > 0) { $scope.event.sport = $stateParams.defaultSport; }

        // Preset Date
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setSeconds(0);
        yesterday.setMilliseconds(0);

        $scope.event.date = new Date();
        $scope.minDate = yesterday.toISOString().slice(0,10);
        $scope.event.time = yesterday;

        // Preset for Gender
        $scope.genderOptions = $rootScope.eventGenders;

        // Preset for Sports (sort by Name)
        $scope.sportOptions = $rootScope.sports;
        $scope.sportOptions.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        // Preset for Skills
        $scope.skillOptions = $rootScope.skills;

        // Config for autocomplete
        $scope.autocompleteOptions = {
            location: new google.maps.LatLng($rootScope.latitude, $rootScope.longitude),
            radius: 2000
        };

        // Modal definition
        $ionicModal.fromTemplateUrl('templates/location-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });
        $scope.openModal = function() {
            $scope.modal.show();
        };
        $scope.closeModal = function() {
            $scope.modal.hide();
        };
        //Cleanup the modal when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.modal.remove();
        });
        // Execute action on hide modal
        $scope.$on('modal.hidden', function() {
            // Execute action
        });
        // Execute action on remove modal
        $scope.$on('modal.removed', function() {
            // Execute action
        });
        // End modal

        // Detect places
        $scope.$watch("event.direction", function(newValue, oldValue) {
            if (typeof $scope.event.direction != "string" && typeof $scope.event.direction != "undefined" && $scope.event.direction != null) {
                $scope.event.address = $scope.event.direction.formatted_address;
                $scope.map.center.latitude = $scope.event.direction.geometry.location.lat();
                $scope.map.center.longitude = $scope.event.direction.geometry.location.lng();

            }
        });

        // Clear function
        $scope.clearDirection = function () {
            $scope.event.direction = '';
        };

        // Create event function
        $scope.createEvent = function () {
            // Missing variables
            $scope.event.datestamp =
                $scope.event.date.getFullYear()
                + '-' + (($scope.event.date.getMonth() + 1) < 10 ? '0':'') + ($scope.event.date.getMonth() + 1)
                + '-' + ($scope.event.date.getDate() < 10 ? '0':'') + $scope.event.date.getDate()
                + ' ' + ($scope.event.time.getHours()  < 10 ? '0':'') + $scope.event.time.getHours()
                + ':' + ($scope.event.time.getMinutes() < 10 ? '0':'') + $scope.event.time.getMinutes()
                + ":00";

            $scope.event.latitude = $scope.map.center.latitude;
            $scope.event.longitude = $scope.map.center.longitude;

            var promise = apiHandler.newEvent($scope.event);

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                $scope.returnedEvent = response.data;
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $ionicHistory.nextViewOptions({disableBack: 'true'});

                $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
            });
        };
        // End create event function

        uiGmapGoogleMapApi.then(function(maps) {
            $scope.map = {
                center: { latitude: $rootScope.lat, longitude: $rootScope.lng },
                zoom: 15,
                options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
            };
        });
    })

    .controller('EventCtrl', function($rootScope, $scope, $stateParams, $window, apiHandler, $state, $ionicPopup, uiGmapGoogleMapApi, $cordovaSocialSharing) {
        var eventId = $stateParams["eventId"];

        var data = {"id": eventId};

        var promise = apiHandler.viewEvent(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            if (response.error != 0) {
                // TODO: throw popup
                $rootScope.error('Ocurrió un error en la operación.');
                window.history.back();
            } else {
                $scope.event = response.data;

                uiGmapGoogleMapApi.then(function(maps) {
                    $scope.marker = {
                        id: 0,
                        coords: {
                            latitude: $scope.event.latitude,
                            longitude: $scope.event.longitude
                        }
                    };

                    $scope.map = {
                        center: { latitude: $scope.event.latitude, longitude: $scope.event.longitude },
                        zoom: 15,
                        options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
                    };
                });

            }
        });


        // Join Event Function
        $scope.joinEvent = function (eventId) {
            var promise = apiHandler.joinEvent({'id': eventId});

            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $state.reload();
                }
            });
        };
        // End Join Event Function

        // Cancel Event confirm popup
        $scope.confirmCancelEvent = function (eventId) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Cancelar Participación',
                template: '¿Estás seguro que deseas cancelar tu participación a la reta?'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    $scope.cancelEvent(eventId);
                }
            })
        };
        // end: cancel event confirm popup

        // Cancel Event Function
        $scope.cancelEvent = function (eventId) {
            var promise = apiHandler.cancelEvent({'id': eventId});

            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $state.reload();
                }
            });
        };
        // End Cancel Event Function

        // Delete Event confirm popup
        $scope.confirmDeleteEvent = function (eventId) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Cancelar Reta',
                template: '¿Estás seguro que deseas eliminar tu reta?'
            });
            confirmPopup.then(function(res) {
                if (res) {
                    $scope.deleteEvent(eventId);
                }
            })
        };
        // end: cancel event confirm popup

        // Delete Event Function
        $scope.deleteEvent = function (eventId) {
            var promise = apiHandler.deleteEvent({'id': eventId});

            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $state.reload();
                }
            });
        };
        // End Cancel Event Function


        // Share Event Function
        $scope.shareEvent = function (code) {

            document.addEventListener("deviceready", function () {

                var callToAction = '¡Descarga la app y únete a La Reta!';
                var link = 'http://www.laretaapp.com/event/' + code;
                var image = 'http://www.laretaapp.com/logo-512.png';

                //Share via native sheet
                $cordovaSocialSharing.share(callToAction, callToAction, null, link).then(function(result) {
                    $rootScope.showMessage('¡Gracias por compartir!')
                }, function(err) {
                    // error
                });

            }, false);
        };
        // End Share Event Function

        // Start: Open in Map
        $scope.openInMaps = function (event) {
            var uri;
            var name = event.location.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,' ');

            if (ionic.Platform.isIOS()) {
                // URI for iOS
                uri = 'http://maps.apple.com/?ll=' + event.latitude + ',' + event.longitude + '&q=' + encodeURIComponent(name);
            } else {
                // Default to the GEO URI standard
                uri = 'geo:0,0?q=' + event.latitude + ',' + event.longitude + '(' + encodeURIComponent(name) + ')';
            }

            $window.open(uri, '_blank');
        };
        // End: Open in Map

        $scope.participants = function(id) {
            $state.go('app.event-participants', { 'eventId': id });
        };

        $scope.messageBoard = function(id) {
            $state.go('app.event-message-board', { 'eventId': id });
        };
    })

    .controller('EventParticipantsCtrl', function($rootScope, $scope, $stateParams, apiHandler, $state) {
        var eventId = $stateParams["eventId"];

        var data = {"id": eventId};

        var promise = apiHandler.viewEventParticipants(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            if (response.error != 0) {
                // TODO: throw popup
                $rootScope.error('Ocurrió un error en la operación.');
                window.history.back();
            } else {
                $scope.event = response.data.event;
                $scope.participants = response.data.participants;
            }
        });

        $scope.viewUser = function(id) {
            $state.go('app.profile-view', { 'userId': id });
        };
    })

    .controller('EventMessageBoardCtrl', function($rootScope, $scope, $stateParams, apiHandler, $state) {
        var eventId = $stateParams["eventId"];


        var data = {"id": eventId};
        $scope.eventId = eventId;

        var promise = apiHandler.listMessage(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            if (response.error != 0) {
                // TODO: throw popup
                $rootScope.error('Ocurrió un error en la operación.');
                window.history.back();
            } else {
                $scope.messages = response.data;
            }
        });

        // Initialize message
        $scope.message = {};

        // New Message Function
        $scope.newMessage = function (eventId) {
            var promise = apiHandler.newMessage({'id': eventId, 'message': $scope.message.comment});

            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $state.reload();
                }
            });
        };
        // End New Message Function


        // Delete Message Function
        $scope.deleteMessage = function (messageId) {
            var promise = apiHandler.deleteMessage({'id': messageId});

            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $state.reload();
                }
            });
        };
        // End Delete Message Function

        $scope.viewUser = function(id) {
            $state.go('app.profile-view', { 'userId': id });
        };

        $scope.expandText = function(){
            var element = document.getElementById("textarea-comment");
            element.style.height =  element.scrollHeight + "px";
        }
    });


