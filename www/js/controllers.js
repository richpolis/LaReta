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
                                       $cordovaFacebook, facebookHandler, $localStorage) {
        $scope.loginData = {
            'devicePlatform': $rootScope.devicePlatform,
            'deviceToken':    $rootScope.deviceToken
        };

        // Login function
        $scope.doLogin = function (data) {

            if($rootScope.deviceToken == "undefined"){
                var token = $localStorage.get("deviceToken","{}",true);
                $rootScope.deviceToken = token.registrationId;
            }
            // obligando a que ponga los datos.
            $scope.loginData.devicePlatform = $rootScope.devicePlatform;
            $scope.loginData.deviceToken = $rootScope.deviceToken;
            $scope.loginData.latitude = $rootScope.lat;
            $scope.loginData.longitude = $rootScope.lng;

            var promise = authService.login($scope.loginData);
            promise.then(function(result) {
                console.log("Login: ")
                console.log(JSON.stringify(result));
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
            $cordovaFacebook.login(["public_profile","email", "user_about_me", "user_birthday"]).then(function(response) {
                console.log("Login Facebook");
                console.log(JSON.stringify(response));
                if (response.hasOwnProperty('authResponse')) {
                    $scope.loginData.facebookId = response.authResponse.userID;
                    $scope.loginData.facebookToken = response.authResponse.accessToken;
                    facebookHandler.setUser(response.authResponse.userID,response.authResponse.accessToken);
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

        $scope.recuperarContrasena = function(){
            if($scope.loginData.email && $scope.loginData.email.length>0){
                authService.recoverPassword($scope.loginData).then(function(result){
                    if (result.error == 0) {
                        console.log(result)
                        $rootScope.showMessage("Se ha enviado una nueva contraseña a su correo");
                    }else{
                        $rootScope.error(
                            $rootScope.getErrorDescription(result.error)
                        );
                    }
                },function(err){
                    console.log(err);
                    $rootScope.showMessage("Error al recuperar contraseña");
                });
            }else{
                var email = document.getElementById('login-email');
                email.focus();
                $rootScope.showMessage('Ingresa tu correo y presiona "Recuperar Contraseña"');
            }
        }
    })

    .controller('SignupCtrl', function($scope, apiHandler, $state, $filter, $rootScope, $ionicPopup, $ionicHistory,
                                       $cordovaFacebook, facebookHandler, $stateParams, authService, jsonUtility,
                                       $localStorage, $cordovaDatePicker, dateUtility) {
        // Initialize variables
        $scope.user = {};
        $scope.user.gender = 0;
        $scope.user.dateString = dateUtility.getStringFromDate(new Date());
        $scope.facebookConnected = false;
        $scope.facebookHasEmail = false;

        $scope.isIOS = $rootScope.isIOS;

        // Preset for gender
        $scope.genderOptions = $rootScope.userGenders;

        // Preset for Sports (sort by Name)
        $scope.sportOptions = $rootScope.sports;
        $scope.sportOptions.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        $scope.showDatePicker = function(){

           var fechaMin = new Date();
           fechaMin.setFullYear(fechaMin.getFullYear()-40);

            var options = {
                date: $scope.user.date || new Date(),
                mode: 'date', // or 'time'
                minDate: fechaMin  - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
              };

              document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(date){
                    $scope.user.date = date;
                    $scope.user.dateString = dateUtility.getStringFromDate(date);
                });

              }, false);
        };

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

                if(apiResponse.hasOwnProperty('picture')){
                    $scope.user.image = apiResponse.picture.data.url;
                    $localStorage.set('user',$scope.user,true);
                }else{
                    $scope.user.image = null;
                }

                $scope.facebookConnected = true;
            });
        }

        // Facebook Signup
        $scope.facebookSignup = function () {
            // Business Logic
            $cordovaFacebook.login(["public_profile","email", "user_about_me", "user_birthday"]).then(function(response) {

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

                    if(apiResponse.hasOwnProperty('picture')){
                        $scope.user.image = apiResponse.picture.data.url;
                        $localStorage.set('user',$scope.user,true);
                    }else{
                        $scope.user.image = null;
                    }

                    $scope.facebookConnected = true;

                    // implementar login en la app.

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

                    if($rootScope.deviceToken == "undefined"){
                        var token = $localStorage.get("deviceToken","{}",true);
                        $rootScope.deviceToken = token.registrationId;
                    }
                    // obligando a que ponga los datos.
                    $scope.user.devicePlatform = $rootScope.devicePlatform;
                    $scope.user.deviceToken = $rootScope.deviceToken;
                    $scope.user.lat = $rootScope.lat;
                    $scope.user.lng = $rootScope.lng;

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

    .controller('LogoutCtrl', function($scope, authService, $state, $ionicHistory, $localStorage) {
        var promise = authService.logout();
        promise.then(function(data) {
            if (data.error == 0) {
                authService.setUser({});
                $localStorage.set('userFacebook',{}, true);
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

    .controller('HomeCtrl', function($scope, $rootScope, $state, $ionicHistory, authService,
        jsonUtility, apiHandler, $cordovaGeolocation, $cordovaFacebook, facebookHandler, $cordovaSocialSharing, $ionicPopup) {
        // Check for auth
        if ( typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser()) ) {
            $rootScope.forceLogout();
            //$state.go('app.login');
        } else {
            // obtiene la posicion actual, para mantener actualizado su posicion.
            console.log("Entrando a geolocalizacion");
            var user = authService.getUser();
            var posOptions = {timeout: 10000, enableHighAccuracy: true};
            $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
               if(user.latitude != "undefined" && user.latitude != position.coords.latitude){
                   user.latitude = position.coords.latitude;
                   user.longitude = position.coords.longitude;
                   apiHandler.updateGeolocation(user).then(function(response){
                        console.log(response);
                        if (response.error != 0) {
                            // Error Handling
                        }else{
                            authService.setUser(user);
                        }
                   });
                }
            }, function(err) {
                // console.info('Returned a Geo error');
            });
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

    .controller('ProfileSelfCtrl', function($scope, apiHandler, $state, $rootScope,
        $cordovaCamera, $cordovaDatePicker, facebookHandler, $localStorage,
        $cordovaDevice, dateUtility) {
        // Initialize user
        $scope.user = {};
        $scope.imageData = {};

        $scope.isIOS = $rootScope.isIOS;

        $scope.version = $cordovaDevice.getVersion();

        $scope.userFacebook = $localStorage.get('userFacebook',{},true);

        var promise = apiHandler.viewUser();

        promise.then(function (response) {
            console.log("Perfil: " + JSON.stringify(response));
            if (response.error != 0) {
                // Error Handling
            }else{
                $scope.user = response.data;

                if($scope.user.birthDate) {
                    // Explode birthDate
                    var dateArr = $scope.user.birthDate.split("-");
                    $scope.user.birthDateDay = parseInt(dateArr[2],10);
                    $scope.user.birthDateMonth = parseInt(dateArr[1],10);
                    $scope.user.birthDateYear = parseInt(dateArr[0],10);
                    $scope.user.date = new Date($scope.user.birthDateYear, ($scope.user.birthDateMonth-1), $scope.user.birthDateDay)
                    console.log($scope.user.date);
                    $scope.user.dateString = dateUtility.getStringFromDate($scope.user.date);
                    console.log($scope.user.dateString);

                    // Check for parameters
                    if ( $scope.userFacebook.facebookToken ) {

                        var promise = facebookHandler.me($scope.userFacebook.facebookToken);

                        promise.then(function(apiResponse) {
                            console.log(JSON.stringify(apiResponse));

                            if(apiResponse.hasOwnProperty('picture')){
                                var image = apiResponse.picture.data.url;

                                if(!$scope.user.image || $scope.user.image != image){
                                    $scope.user.image = image;
                                    apiHandler.updateImage($scope.user).then(function(imageData){
                                        $localStorage.set('user',user,true);
                                        $state.transitionTo($state.current, {}, {
                                                    reload: true,
                                                    inherit: false,
                                                    notify: true
                                               });
                                    },function(err){
                                        console.log(err);
                                        alert("Error al guardar la imagen")
                                    })
                                }

                            }else{
                                $scope.user.image = null;
                            }

                            $scope.facebookConnected = true;
                        });

                        $scope.facebookConnected = true;
                    }else{
                        $scope.facebookConnected = false;
                    }
                }else{
                    $scope.user.dateString = dateUtility.getStringFromDate($scope.user.date);
                }
            }
        });

        $scope.showDatePicker = function(){

            var fechaMin = new Date();
            fechaMin.setFullYear(fechaMin.getFullYear()-40);

            var options = {
                date: $scope.user.date || new Date(),
                mode: 'date', // or 'time'
                minDate: fechaMin  - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
              };

              document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(date){
                    $scope.user.date = date;
                    $scope.user.dateString = dateUtility.getStringFromDate(date);
                });

              }, false);

        };

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

        $scope.goToChangePassword = function(){
            $state.go('app.change-password');
        }

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

    .controller('changePasswordCtl', function ($scope, $rootScope, $state, authService, apiHandler) {

        $scope.loginData = {
            'email': '',
            'password': '',
            'new_password': '',
            'repeat_password': ''
        };

        var promise = apiHandler.viewUser();

        promise.then(function (response) {
            //debugger;
            console.log(response);

            if (response.error != 0) {
                // Error Handling
            }else{
                var user = response.data;

                $scope.loginData.email = user.email;
                $scope.loginData.password = user.password;

            }
        });

        // SendForm function
        $scope.doSendForm = function () {
            //validaciones
            if($scope.loginData.new_password.length<=4){
                $rootScope.showMessage("La contraseña es demasiado corta");
            } else if($scope.loginData.new_password == $scope.loginData.password){
                $rootScope.showMessage("El nuevo password es la misma contraseña actual");
            } else if ($scope.loginData.repeat_password != $scope.loginData.new_password){
                $rootScope.showMessage("No coinciden las contraseñas");
            } else {
                $scope.loginData.password = $scope.loginData.new_password;
                authService.changePassword($scope.loginData).then(function(data){
                    if(data.error==0){
                        $rootScope.showMessage("Se ha realizado el cambio de contraseña");
                        console.log(data);
                        $state.go('app.profile-self')
                    }else{
                        $rootScope.error(
                            $rootScope.getErrorDescription(data.error)
                        );
                    }
                },function(err){
                    console.log(err);
                    $rootScope.showMessage("Error en cambio de contraseña");
                });
            }

        };
        // END sendform function


    })

    .controller('NoInternetCtrl', function($scope, $state, $ionicHistory) {
        $scope.goBack = function ()  {
            $ionicHistory.goBack();
        };
    })

    .controller('ProfileViewCtrl', function($scope, $stateParams, apiHandler, $rootScope) {

        var userId = $stateParams["userId"];

        var data = {"userId": userId};

        var promise = apiHandler.viewUser(data);

        $scope.isIOS = $rootScope.isIOS;

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

    .controller('NewEventCtrl', function($rootScope, $scope, $location,
        $stateParams, apiHandler, facebookHandler, $state, $ionicHistory, uiGmapGoogleMapApi,
        $ionicModal, $ionicPopup, $cordovaDatePicker, $cordovaDevice, dateUtility,
        $localStorage, $cordovaGeolocation, $ionicScrollDelegate, $cordovaSocialSharing) {
        
        // Needed variables
        $scope.event = $localStorage.get("new_event", {} ,true);
        $scope.event.skill = $scope.event.skill || 0;
        $scope.event.gender = $scope.event.gender || 0;

        $scope.event.seleccionarCancha = $scope.event.seleccionarCancha || true ;

        //$scope.version = $cordovaDevice.getVersion();

        // Preset Sport
        if ($stateParams.defaultSport > 0) { $scope.event.sport = $stateParams.defaultSport; }

        // Preset Date
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setSeconds(0);
        yesterday.setMilliseconds(0);

        var hoyMasUnaHora = new Date();
        var horaActual = hoyMasUnaHora.getHours();
        if(horaActual < 23){
            hoyMasUnaHora.setHours(horaActual + 1);
        }else{
            hoyMasUnaHora.setDate(hoyMasUnaHora.getDate()+1);
            hoyMasUnaHora.setHours(0);
        }
        hoyMasUnaHora.setSeconds(0);
        hoyMasUnaHora.setMilliseconds(0);

        // si seleccionarCancha esta activa, es decir que inicia el proceso de lo contrario esta terminara el proceso
        if($scope.event.seleccionarCancha){    
            $scope.event.date = new Date();
            console.log($scope.event.date);
            // mascara de date
            $scope.event.dateString =  dateUtility.getStringFromDate($scope.event.date);
            $scope.minDate = yesterday.toISOString().slice(0,10);
            $scope.event.time = hoyMasUnaHora;
            // mascara de time
            $scope.event.timeString =  dateUtility.getStringFromTime($scope.event.time);
        }else{
            $scope.createEventFinally();
        }

        // Preset for Gender
        $scope.genderOptions = $rootScope.eventGenders;

        // Preset for Sports (sort by Name)
        $scope.sportOptions = $rootScope.sports;
        $scope.sportOptions.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        // Preset for Skills
        $scope.skillOptions = $rootScope.skills;

        $scope.showDatePicker = function(){
            console.log($scope.event.date);
            var options = {
                date: $scope.event.date || new Date(),
                mode: 'date', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: false,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
              };

              document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(date){
                    $scope.event.date = date;
                    $scope.event.dateString =  dateUtility.getStringFromDate($scope.event.date);
                });

              }, false);
        };

        $scope.showTimePicker = function(){
            var options = {
                date: $scope.event.time || new Date(),
                mode: 'time', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
              };

              document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(time){
                    $scope.event.time = time;
                    $scope.event.timeString =  dateUtility.getStringFromTime($scope.event.time);
                });

              }, false);
        };

        $scope.createEventFinally = function(){
            var promise = apiHandler.newEvent($scope.event);

                promise.then(function (response) {
                    console.log("Response:");
                    console.log(response);

                    $scope.returnedEvent = response.data;
                    $ionicHistory.clearHistory();
                    $ionicHistory.clearCache();
                    $ionicHistory.nextViewOptions({disableBack: 'true'});

                    $localStorage.set("new_event", {} ,true);

                    //$scope.returnedEvent = {'id': 61};
                    $scope.compartirEvento();

                });
        }

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

            var fecha = new Date();
            var hoy = new Date();

            /*
                Esto pasa al manejador de canchas
                $scope.event.latitude = $scope.map.center.latitude;
                $scope.event.longitude = $scope.map.center.longitude;
            */

            fecha.setFullYear($scope.event.date.getFullYear(),$scope.event.date.getMonth(),$scope.event.date.getDate());
            fecha.setHours($scope.event.time.getHours());
            fecha.setMinutes($scope.event.time.getMinutes());
            fecha.setSeconds(0);

            if(fecha < hoy){
                $ionicPopup.alert({
                    title: 'Error: Fecha y Hora!',
                    template: 'Favor de revisar la fecha y hora de La Reta'
                });
                return false;
            }

            var todoCorrecto = true;
            var formulario = document.getElementById('eventForm');
            for (var i = 0; i < formulario.length; i++) {
                if (formulario[i].type == 'text' || formulario[i].type == 'tel' || formulario[i].type == 'email' || formulario[i].type == 'password') {
                    if (formulario[i].value === null || formulario[i].value.length == 0 || /^\s*$/.test(formulario[i].value)) {
                        $ionicPopup.alert({
                            title: 'Error de llenado!',
                            template: formulario[i].name + ' no puede estar vacío o contener sólo espacios en blanco'
                        });
                        todoCorrecto = false;
                        break;
                    }
                }
            }

            if (!todoCorrecto)
                return false;


            console.log("Nuevo evento: " + JSON.stringify($scope.event));

            if(!$scope.event.seleccionarCancha){

                // crea el evento finalmente    
                $scope.createEventFinally();

            }else{
                
                $localStorage.set("new_event",$scope.event,true);
                $state.go("app.canchas");

            }

        };

        $scope.compartirEvento = function(){
            var confirmPopup = $ionicPopup.confirm({
                title: '¡Compartir La Reta!',
                template: '<strong>¿Quieres compartir tu Reta?</strong>'
            });

            confirmPopup.then(function(res){
                if(res){
                    var sportName = '';
                    for(var cont=0; cont<$scope.sportOptions.length; cont++){
                        if($scope.sportOptions[cont].id == $scope.event.sport){
                            sportName = $scope.sportOptions[cont].name;
                        }
                    }
                    var message = '¡Se ha creado la nueva reta de ' + sportName+', descarga la app y únete a La Reta!';
                    var subject = 'La Reta';
                    var image1 = 'https://s3-us-west-1.amazonaws.com/lareta/images/logo-512.png';
                    var link = '';

                    if($rootScope.isAndroid){
                        link = 'http://play.google.com/store/apps/details?id=com.laretaapp.laretaapp';
                    }else if($rootScope.isIOS){
                        link = 'https://itunes.apple.com/us/app/la-reta/id1064095543';
                    }

                    link = "http://www.laretaapp.com";

                    var userFacebook = facebookHandler.getUser();

                    if(userFacebook.facebookId){

                        //Share via native Facebook
                        $cordovaSocialSharing.shareViaFacebookWithPasteMessageHint(message, null, link, subject).then(function(result) {
                            // success
                            console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
                            console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
                            var alertPopup = $ionicPopup.alert({
                                title: 'La Reta',
                                template: '¡Gracias por compartir!'
                            });

                            alertPopup.then(function(res) {
                                $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
                            });
                        }, function(err) {
                            // error
                            console.log("Sharing failed with message: " + err);
                            $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
                        });
                     }else{
                        //Share via native sheet
                        $cordovaSocialSharing.share(message, subject, null, link).then(function(result) {
                            // success
                            console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
                            console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
                            var alertPopup = $ionicPopup.alert({
                                title: 'La Reta',
                                template: '¡Gracias por compartir!'
                            });

                            alertPopup.then(function(res) {
                                $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
                            });
                        }, function(err) {
                            // error
                            console.log("Sharing failed with message: " + err);
                            $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
                        });
                    }
                }else{
                    $state.go('app.event-view', { 'eventId': $scope.returnedEvent.id });
                }
            });
        }

        $scope.$on('update_new_event', function(event, args) {
            // do what you want to do
            $scope.event = $localStorage.get("new_event", {} ,true);
        });
        

    })

    .controller('EventCtrl', function($rootScope, $scope, $stateParams, $window, apiHandler,
                                    $state, $ionicPopup, uiGmapGoogleMapApi, $cordovaSocialSharing) {

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

                var message = '¡Reta de ' + $scope.event.sportName+', descarga la app y únete a La Reta!';
                var subject = 'La Reta';
                var image2 = 'https://static.wixstatic.com/media/add6c9_f768a8a899c243f8926449e9bfb44503.png/v1/fill/w_600,h_600,al_c,usm_0.66_1.00_0.01/add6c9_f768a8a899c243f8926449e9bfb44503.png';
                var image1 = 'https://s3-us-west-1.amazonaws.com/lareta/images/logo-512.png';
                var link = 'http://www.laretaapp.com/event/' + code;

                if($rootScope.isAndroid){
                    link = 'http://play.google.com/store/apps/details?id=com.laretaapp.laretaapp';
                }else if($rootScope.isIOS){
                    link = 'https://itunes.apple.com/us/app/la-reta/id1064095543';
                }

                //Share via native sheet
                $cordovaSocialSharing.share(message, subject, null, link).then(function(result) {
                    // success
                    console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
                    console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
                    $rootScope.showMessage('¡Gracias por compartir!')
                }, function(err) {
                    // error
                    console.log("Sharing failed with message: " + err);
                });

            }, false);
        };
        // End Share Event Function

        // Start: Open in Map
        $scope.openInMaps = function (event) {
            var uri;
            var name = event.location.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,' ');

            console.log("entro a open in maps");

            if (ionic.Platform.isIOS()) {
                // URI for iOS
                uri = 'http://maps.apple.com/?ll=' + event.latitude + ',' + event.longitude + '&q=' + encodeURIComponent(name);
            } else {
                // Default to the GEO URI standard
                uri = 'geo:0,0?q=' + event.latitude + ',' + event.longitude + '(' + encodeURIComponent(name) + ')';
            }

            console.log("URI: " + uri);

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
    })
    .controller('CanchasCtrl', function($rootScope, $scope, $location,
                                        $stateParams, apiHandler, facebookHandler, $state, $ionicHistory, uiGmapGoogleMapApi,
                                        $ionicModal, $ionicPopup, $cordovaDatePicker, $cordovaDevice, dateUtility,
                                        $localStorage, $cordovaGeolocation, $ionicScrollDelegate, PaypalService, $cordovaCamera) {

        // Needed variables
        $scope.event = $localStorage.get("new_event", { seleccionarCancha: false } ,true);
        $scope.canchas = [];

        $scope.user = $localStorage.get('user',{}, true);
        var promise = null;
        if($scope.event.seleccionarCancha) {
            promise = apiHandler.listCancha($scope.user);
        }else{
            promise = apiHandler.listAdminCancha($scope.user);
        }

        promise.then(function (response) {
            console.log("Response:");
            console.log(JSON.stringify(response.data));

            if (response.error != 0) {
                // TODO: throw popup
                $rootScope.error('Ocurrió un error en la operación.');
            } else {
                var canchas = response.data;
                $scope.miscanchas = [];
                $scope.canchas = [];

                for(var cont=0; cont<canchas.length; cont++){
                    if(canchas[cont].administrador.id == $scope.user.id){
                        $scope.miscanchas.push(canchas[cont]);
                    }else{
                        $scope.canchas.push(canchas[cont]);
                    }
                }

                $localStorage.set('canchas',canchas,true);
            }
        });

        $scope.gotoNewCancha = function(){
            $state.go('app.cancha-new');
        }

        $scope.gotoCancha = function(canchaId){
            $state.go('app.cancha', {'canchaId': canchaId});
        }

        $scope.gotoMisReservaciones = function(){
            var fecha = new Date();
            //debugger;
            $state.go('app.reservaciones', {
                'usuarioId': $scope.user.id,
                'month': fecha.getMonth() + 1,
                'year': fecha.getFullYear()  
            });
        };


        // Si es seleccionar canchas, mostrar el arreglo seleccionar canchas privadas.
        

        $scope.paypalTest = function(){
            PaypalService.initPaymentUI().then(function () {

                PaypalService.makePayment(100, "Total Amount").then(function (response) {

                    alert("success"+JSON.stringify(response));

                }, function (error) {

                    alert("Transaction Canceled");

                });

            });
        }



    })
    .controller('CanchaCtrl', function($rootScope, $scope, $location,
                                       $stateParams, apiHandler, facebookHandler, $state, $ionicHistory, uiGmapGoogleMapApi,
                                       $ionicModal, $ionicPopup, $cordovaDatePicker, $cordovaDevice, dateUtility,
                                       $localStorage, $cordovaGeolocation, $ionicScrollDelegate, $cordovaCamera) {


        // Needed variables
        $scope.event = $localStorage.get("new_event", { seleccionarCancha: false } ,true);
        $scope.user = $localStorage.get('user',{}, true);
        var canchaId = $stateParams["canchaId"];

        var data = {"canchaId": canchaId, 'month': 0, 'year': 0};
        $scope.canchaId = canchaId;

        var promise = apiHandler.viewCancha(data);
        promise.then(function (result) {
            if (result.error != 0) {
                $rootScope.error(
                    $rootScope.getErrorDescription(result.error)
                );
            } else {
                $scope.cancha = result.data;
                $scope.cancha.hora_inicio = new Date("1/1/1900 " + result.data.hora_inicio);
                $scope.cancha.hora_fin = new Date("1/1/1900 " + result.data.hora_fin);
                $scope.cancha.isAdmin = $scope.cancha.administrador.id == $scope.user.id
                $scope.canchaData = $scope.cancha;

                console.log($scope.canchaData);

                uiGmapGoogleMapApi.then(function(maps) {
                    $scope.marker = {
                        id: 0,
                        coords: {
                            latitude: $scope.cancha.latitude,
                            longitude: $scope.cancha.longitude
                        }
                    };

                    $scope.map = {
                        center: { latitude: $scope.cancha.latitude, longitude: $scope.cancha.longitude },
                        zoom: 15,
                        options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
                    };
                });
            }
        });

        $scope.gotoEditCancha = function(){
            $state.go('app.cancha-edit', {'canchaId': $scope.cancha.id});
        };

        $scope.gotoReservaciones = function(){
            var now = new Date();
            var day = now.getDate(), month = now.getMonth(), year=now.getFullYear();
            
            $localStorage.set('cancha', $scope.cancha, true);

            $state.go('app.cancha-calendario', {
                'canchaId': $scope.cancha.id,
                'day': day,
                'month': month,
                'year': year
            });
        };

        $scope.deleteCancha = function() {

            var confirmPopup = $ionicPopup.confirm({
                title: 'LaReta',
                template: 'Estas seguro de eliminar la cancha?'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    var cancha = $scope.cancha;
                    cancha.canchaId = $scope.cancha.id;
                    var promise = apiHandler.deleteCancha(cancha);
                    promise.then(function (response) {
                        console.log("Response:");
                        console.log(response);

                        if (response.error != 0) {
                            // TODO: throw popup
                            $rootScope.error('Ocurrió un error en la operación.');
                        } else {
                            $scope.canchas = response.data;
                        }
                    });
                }
            });

        };

    })
    .controller('CanchaNewCtrl', function($rootScope, $scope, $location,
                                       $stateParams, apiHandler, facebookHandler, $state, $ionicHistory, uiGmapGoogleMapApi,
                                       $ionicModal, $ionicPopup, $cordovaDatePicker, $cordovaDevice, dateUtility,
                                       $localStorage, $cordovaGeolocation, $ionicScrollDelegate, $cordovaCamera) {

        var canchaId = $stateParams["canchaId"];
        var user = $localStorage.get('user',{}, true);
        $scope.isIOS = $rootScope.isIOS;

        // Config for autocomplete
        $scope.autocompleteOptions = {
            location: new google.maps.LatLng($rootScope.lat, $rootScope.lng),
            radius: 2000
        };

        var data = {"canchaId": canchaId, 'month': 0, 'year': 0};
        $scope.canchaId = canchaId;

        if($scope.canchaId > 0){

            var promise = apiHandler.viewCancha(data);
            promise.then(function (result) {
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $scope.cancha = result.data;
                    $scope.cancha.hora_inicio = new Date("1/1/1900 " + result.data.hora_inicio);
                    $scope.cancha.hora_fin = new Date("1/1/1900 " + result.data.hora_fin);
                    $scope.canchaData = $scope.cancha;

                    console.log($scope.canchaData);

                    uiGmapGoogleMapApi.then(function(maps) {
                        $scope.marker = {
                            id: 0,
                            coords: {
                                latitude: $scope.cancha.latitude,
                                longitude: $scope.cancha.longitude
                            }
                        };

                        $scope.map = {
                            center: { latitude: $scope.cancha.latitude, longitude: $scope.cancha.longitude },
                            zoom: 15,
                            options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
                        };
                    });
                }
            });
        }else{

            uiGmapGoogleMapApi.then(function(maps) {
                console.log("Entro a uiGmapGoogleMapApi");
                $scope.map = {
                    center: { latitude: $rootScope.lat, longitude: $rootScope.lng },
                    zoom: 15,
                    options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
                };
                console.log($scope.map);
            });
            $scope.canchaData = {
                name: '',
                description: '',
                hora_inicio: new Date(),
                hora_fin: new Date(),
                dias_disponibles: {
                    dom: true,
                    lun: true,
                    mar: true,
                    mie: true,
                    jue: true,
                    vie: true,
                    sab: true
                },
                image: "data:image/png;base64,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",
                precio: 100.00,
                is_public: true,
                tipos_pago: {
                    efectivo: true,
                    paypal: true,
                    credito: true
                }
            };
            $scope.canchaData.hora_inicio.setHours(7);
            $scope.canchaData.hora_inicio.setMinutes(0);
            $scope.canchaData.hora_inicio.setSeconds(0);
            $scope.canchaData.hora_fin.setHours(21);
            $scope.canchaData.hora_fin.setMinutes(0);
            $scope.canchaData.hora_fin.setSeconds(0);

        }

        // Accion para crear la cancha
        $scope.doCanchaForm = function () {
            $scope.canchaData.administrador = user.id;
            var canchaData = $scope.canchaData;
            var horaInicio = $scope.canchaData.hora_inicio;
            var horaFin = $scope.canchaData.hora_fin;

            canchaData.hora_inicio = dateUtility.getStringFromDateTime(horaInicio);

            canchaData.hora_fin = dateUtility.getStringFromDateTime(horaFin);

            var promise = null;
            if($scope.canchaId > 0){
                promise = apiHandler.editCancha(canchaData);
            }else{
                promise = apiHandler.newCancha(canchaData);
            }

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                if (response.error != 0) {
                    // TODO: throw popup
                    $rootScope.error('Ocurrió un error en la operación.');
                } else {
                    $state.go('app.canchas');

                }
            });

        };

        // Get Picture
        $scope.imageCancha = function () {
            document.addEventListener("deviceready", function () {

                var options = {
                    quality: 80,
                    destinationType: Camera.DestinationType.DATA_URL,
                    cameraDirection: Camera.Direction.FRONT,
                    sourceType: Camera.PictureSourceType.CAMERA,
                    allowEdit: false,
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
                    $scope.canchaData.image = "data:image/jpeg;base64," + imageData;


                }, function(err) {
                    // error
                });

            }, false);
        };
        // End Get Picture

        // Modal definition
        $ionicModal.fromTemplateUrl('cancha-location-modal.html', {
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
        $scope.$watch("canchaData.direction", function(newValue, oldValue) {
            if(typeof $scope.canchaData == "undefined"){
                return false;
            }
            var latitude = $scope.canchaData.latitude || 0;
            var longitude = $scope.canchaData.longitude || 0;
            if (typeof $scope.canchaData.direction != "string" && typeof $scope.canchaData.direction != "undefined" && $scope.canchaData.direction != null) {
                $scope.canchaData.address = $scope.canchaData.direction.formatted_address;
                latitude = $scope.canchaData.direction.geometry.location.lat();
                longitude = $scope.canchaData.direction.geometry.location.lng();
                $scope.map.center.latitude = latitude;
                $scope.map.center.longitude = longitude;
                $scope.canchaData.latitude = latitude;
                $scope.canchaData.longitude = longitude;

            }else if(typeof $scope.canchaData.direction == "string" && $scope.canchaData.direction == "Mi ubicacion"){
                latitude = $rootScope.lat;
                longitude = $rootScope.lng;
                $scope.map.center.latitude = latitude;
                $scope.map.center.longitude = longitude;
                $scope.canchaData.latitude = latitude;
                $scope.canchaData.longitude = longitude;

                var myLatlng = new google.maps.LatLng($rootScope.lat, $rootScope.lng);
                var geocoder = new google.maps.Geocoder();

                geocoder.geocode({'latLng': myLatlng}, function(results, status) {
                    console.log(results);
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[3]) {
                            $scope.canchaData.address = results[0].formatted_address;
                        }
                    } else {
                        alert("no se pudo determinar el nombre de ubicación : " + status);
                    } //end else
                });
            }
        });

        $scope.centerOnMe = function () {
            if (!$scope.map)
                return;
            $rootScope.showLoader(true);
            var posOptions = {timeout: 10000, enableHighAccuracy: true};
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    $rootScope.showLoader(false);
                    $rootScope.lat = position.coords.latitude;
                    $rootScope.lng = position.coords.longitude;
                    $scope.canchaData.direction = "Mi ubicacion";
                    $ionicScrollDelegate.scrollTop();
                }, function (err) {
                    $rootScope.showLoader(false);
                    $ionicPopup.alert({
                        title: 'Error de localizacion!',
                        template: 'No esta activa la localizacion'
                    });
                });
        }


        $scope.showTimePickerHoraInicio = function(){
            var options = {
                date: $scope.canchaData.hora_inicio || new Date(),
                mode: 'time', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };

            document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(time){
                    $scope.canchaData.hora_inicio = time;
                    $scope.canchaData.hora_inicio_string =  dateUtility.getStringFromTime($scope.canchaData.hora_inicio);
                });

            }, false);
        };

        $scope.showTimePickerHoraFin = function(){
            var options = {
                date: $scope.canchaData.hora_fin || new Date(),
                mode: 'time', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: true,
                allowFutureDates: false,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
            };

            document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(time){
                    $scope.canchaData.hora_fin = time;
                    $scope.canchaData.hora_fin_string =  dateUtility.getStringFromTime($scope.canchaData.hora_fin);
                });

            }, false);
        };
    })
    .controller('CalendarioCtrl', function($rootScope, $scope, $stateParams, apiHandler, $state, $ionicModal,
                                            dateUtility, $localStorage, PaypalService, $ionicPopup) {

        $scope.event = $localStorage.get("new_event", {id: 0, seleccionarCancha: false } ,true);
        $scope.cancha = $localStorage.get("cancha", { id: 0 } ,true);  

        var canchaId    = $stateParams["canchaId"];
        var user        = $localStorage.get('user',{}, true);
        var month       = $stateParams["month"];
        var year        = $stateParams["year"];
        var day         = $stateParams["day"] || $scope.event.fecha.getDate(); 
        var fecha =     { 'day': day, 'month': parseInt(month) + 1 , 'year': year};

        
        $scope.minDate = new Date(year, month, day, 0, 0, 0, 0);
        $scope.isIOS = $rootScope.isIOS;

        $scope.horas = [];
        var horaInicioCancha = new Date($scope.cancha.hora_inicio); 
        var horaFinCancha = new Date($scope.cancha.hora_fin);
        var i=0;
        
        for(i=horaInicioCancha.getHours(); i<horaFinCancha.getHours();i++){
            $scope.horas.push({hora: i, texto: ((i>=10)?i:'0'+i) + ((i>=12)?'pm':'am')})
        }

        $scope.canchaId = canchaId;

        $scope.goToFecha = function(obj){
            obj = obj || $scope.calendarioData.fecha;
            obj.canchaId = canchaId;
            $rootScope.showLoader(true);
            var promise = apiHandler.listReservacionesForCancha(obj);
            promise.then(function (result) {
                $rootScope.showLoader(false);
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    //$scope.reservaciones = result.data;
                    debugger;
                    var reservaciones = [];
                    var dataReservaciones = result.data;
                    var cont = 0;

                    // crea la pizarra para seleccionar los horarios
                    for(cont = 0; cont < 24; cont++){
                        reservaciones.push({
                            className: 'calendario-horario-no-disponible', 
                            text: '', 
                            abierto: false,
                            ocupado: false,
                            horario: ((cont>=10)?cont:'0'+cont) + ((cont>=12)?'pm':'am'),
                            hora: cont
                        })
                    }

                    // marca los horarios que si esta abierta la cancha
                    for(cont=horaInicioCancha.getHours(); cont<=horaFinCancha.getHours(); cont++){
                        reservaciones[cont].className='calendario-horario-disponible';
                        reservaciones[cont].text = 'Disponible'
                        reservaciones[cont].abierto = true
                    }

                    var hi = 0; // hora que inicia
                    var ht = 0; // hora que termina
                    for(cont=0; cont<dataReservaciones.length; cont++){
                        var fechaHi = new Date(dataReservaciones[cont].fecha + " " + dataReservaciones[cont].hora_inicio);
                        var fechaHt = new Date(dataReservaciones[cont].fecha + " " + dataReservaciones[cont].hora_fin);
                        hi = fechaHi.getHours()
                        ht = fechaHt.getHours()
                        reservaciones[hi].className='calendario-horario-ocupado';
                        reservaciones[hi].ocupado = true;
                        reservaciones[hi].text = 'Ocupado ' +  ((hi>=10)?hi:'0'+hi) + ((hi>=12)?'pm':'am') + " - " + ((ht>=10)?ht:'0'+ht) + ((ht>=12)?'pm':'am'),
                        reservaciones[hi].data = dataReservaciones[cont];
                    }

                    $scope.reservaciones = reservaciones;

                }
            });
        };

        $scope.goToFecha(fecha);

        $scope.goToAfterFecha = function(){
            var fecha = $scope.calendarioData.fecha;
            var day = fecha.getDate();
            var month = fecha.getMonth();
            var year = fecha.getFullYear();

            var obj =     { 'day': day, 'month': month , 'year': year};

            $scope.goToFecha(obj);
        };

        // Creamos un modal para crear canchas del usuario
        $ionicModal.fromTemplateUrl('templates/calendarioFormModal.html', {
            scope: $scope
        }).then(function (modalForm) {
            $scope.calendarioFormModal = modalForm;
        });

        $scope.calendarioData = {
            id: 0,
            fecha: $scope.minDate,
            fecha_string: dateUtility.getStringFromDate($scope.minDate),
            hora_inicio: null,
            hora_fin: null
        };

        $scope.seleccionarHorario = function(hora, data){
            data = data || {};
            if(data.usuario && data.usuario.id){
                // Custom popup
                var alertPopup = $ionicPopup.alert({
                    title: 'Reservacion',
                    template: data.usuario.fullName
                });

                alertPopup.then(function(res) {
                    // Ninguna funcionalidad adicional por el momento
                });
            }else{
                $scope.calendarioData.hora_inicio = hora;
                $scope.calendarioData.hora_fin = hora + 1;
                $scope.showCalendarioCanchaForm();
            }
        }

        // Accion para cerrar el formCalendarioCancha
        $scope.closeCalendarioCanchaForm = function () {
            $scope.calendarioFormModal.hide();
        };

        // Accion para mostrar el formCalendarioCancha
        $scope.showCalendarioCanchaForm = function () {
            $scope.calendarioFormModal.show();
        };

        // Accion para crear la cancha
        $scope.doCrearReservacion = function (is_pay) {
            debugger;
            var calendarioData = $scope.calendarioData;
            var fecha = $scope.calendarioData.fecha;
            var horaInicio = $scope.calendarioData.hora_inicio;
            var horaFin = $scope.calendarioData.hora_fin;
            is_pay = is_pay || false;

            calendarioData.fecha = new Date(dateUtility.getStringFromDateTime(fecha));
            calendarioData.hora_inicio = new Date("2017-08-22 " + horaInicio + ":00:00");
            calendarioData.hora_fin = new Date("2017-08-22 " + horaFin + ":00:00");
            calendarioData.usuarioId = user.id;
            calendarioData.canchaId = canchaId;
            calendarioData.eventId = $scope.event.id;
            calendarioData.is_pay = is_pay;

            var promise = apiHandler.newReservacion(calendarioData);

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                if (response.error != 0) {
                    // TODO: throw popup
                    $rootScope.error('Ocurrió un error en la operación.');
                } else {
                    $scope.closeCalendarioCanchaForm();
                    if ($scope.event.seleccionarCancha) {
                        $scope.finalizarSeleccionarCancha(response.data);
                    }
                }
            });

        };

        $scope.finalizarSeleccionarCancha = function(data){
            $scope.event.reservacionId = data.id;
            $scope.event.seleccionarCancha = false;
            $localStorage.set("new_event", $scope.event, true);
            alert(JSON.stringify($scope.event));
            $rootScope.$broadcast('update_new_event');
            $state.go('app.event-new');
        };


        $scope.realizarPago = function(){
          if($scope.calendarioData.hora_inicio >= $scope.calendarioData.hora_fin){
            // Custom popup
            var alertPopup = $ionicPopup.alert({
                title: 'Reservacion',
                template: 'Los horarios no concuerdan'
            });

            alertPopup.then(function(res) {
                return false;
            });
          }else{
              var horas = $scope.calendarioData.hora_fin - $scope.calendarioData.hora_inicio;
          }  

          PaypalService.initPaymentUI().then(function () {
              PaypalService.makePayment($scope.cancha.precio * horas , "Total").then(function(payment){
                $scope.event.payment = payment;
                alert(JSON.stringify(payment));
                $scope.calendarioData.is_pay = true;
                $localStorage.set("new_event", $scope.event, true);
                $scope.doCrearReservacion(true);
              },function(err){
                console.log("Error " +  err);
              });
          });
        }

        $scope.showDatePicker = function(){
            console.log($scope.calendarioData.fecha);
            var options = {
                date: $scope.calendarioData.fecha || new Date(),
                mode: 'date', // or 'time'
                minDate: new Date() - 10000,
                allowOldDates: false,
                allowFutureDates: true,
                doneButtonLabel: 'DONE',
                doneButtonColor: '#F2F3F4',
                cancelButtonLabel: 'CANCEL',
                cancelButtonColor: '#000000'
              };

              document.addEventListener("deviceready", function () {

                $cordovaDatePicker.show(options).then(function(date){
                    $scope.calendarioData.fecha = date;
                    $scope.calendarioData.fecha_string =  dateUtility.getStringFromDate($scope.calendarioData.fecha);
                });

              }, false);
        };

        

        // Detect places
        $scope.$watch("calendarioData.hora_inicio", function(newValue, oldValue) {
            if(newValue == null){
                return;
            }
            if($scope.calendarioData.hora_fin == null || $scope.calendarioData.id == 0){
                $scope.calendarioData.hora_fin = $scope.calendarioData.hora_inicio + 1;
            }
        });

    })
    .controller('ReservacionesCtrl', function($rootScope, $scope, $stateParams, apiHandler, $state, $ionicModal,
                                              dateUtility, $localStorage, PaypalService, $ionicPopup) {

        $scope.user = $localStorage.get('user', {}, true);

        var usuarioId    = $scope.user.id;
        var mes         = $stateParams["month"];
        var year        = $stateParams["year"];
        var fecha =     { 'month': mes, 'year': year };

        $scope.minDate = new Date(year, mes, 1, 0, 0, 0, 0);
        $scope.isIOS = $rootScope.isIOS;

        $scope.goToFecha = function(obj){
            obj.usuarioId = usuarioId;
            $rootScope.showLoader(true);
            var promise = apiHandler.listReservacionesForUser(obj);
            promise.then(function (result) {
                console.log(result);
                $rootScope.showLoader(false);
                if (result.error != 0) {
                    $rootScope.error(
                        $rootScope.getErrorDescription(result.error)
                    );
                } else {
                    $scope.reservaciones = result.data;
                }
            });
        };

        $scope.goToFecha(fecha);

        $scope.realizarPago = function(){
            // calculamos las horas que es el juego
            var horas = $scope.reservacion.hora_fin - $scope.reservacion.hora_inicio;
            // calculamos el precio y lo formateamos en dos decimales
            var precio = parseFloat(Math.round(($scope.reservacion.precio * horas) * 100) / 100).toFixed(2);

            PaypalService.initPaymentUI().then(function () {
                // hacemos el pago
                PaypalService.makePayment("" + precio, "Total").then(function(payment){
                    $scope.reservacion.payment = payment;
                    $scope.reservacion.is_pay = true;
                },function(err){
                    console.log("Error " +  err);
                });
            });
        };

        

        $scope.showReservacion = function(reservacion){
            $scope.reservacion = reservacion;
            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                templateUrl: 'templates/reservacionModal.html',
                title: 'Mostrar mi Reservacion',
                scope: $scope,
                buttons: [
                  { text: 'Cerrar' },
                ]
              });

              myPopup.then(function(res) {
                console.log('Tapped!', res);
              });

        }

    })
;
