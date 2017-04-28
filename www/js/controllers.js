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
            debugger;
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
        $scope.event = {};
        $scope.event.skill = 0;
        $scope.event.gender = 0;

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

        $scope.event.date = new Date();
        console.log($scope.event.date);
        // mascara de date
        $scope.event.dateString =  dateUtility.getStringFromDate($scope.event.date);
        $scope.minDate = yesterday.toISOString().slice(0,10);
        $scope.event.time = hoyMasUnaHora;
        // mascara de time
        $scope.event.timeString =  dateUtility.getStringFromTime($scope.event.time);
        

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
            location: new google.maps.LatLng($rootScope.lat, $rootScope.lng),
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
            }else if(typeof $scope.event.direction == "string" && $scope.event.direction == "Mi ubicacion"){
                $scope.map.center.latitude = $rootScope.lat;
                $scope.map.center.longitude = $rootScope.lng;

                var myLatlng = new google.maps.LatLng($rootScope.lat, $rootScope.lng);
                var geocoder = new google.maps.Geocoder();
                
                geocoder.geocode({'latLng': myLatlng}, function(results, status) {
                    console.log(results);
                 if (status == google.maps.GeocoderStatus.OK) {
                   if (results[3]) {
                     $scope.event.address = results[0].formatted_address;
                   }
                 } else {
                   alert("no se pudo determinar el nombre de ubicación : " + status);
                 } //end else
                });
            }
        });

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
        
            var fecha = new Date();
            var hoy = new Date();

            $scope.event.latitude = $scope.map.center.latitude;
            $scope.event.longitude = $scope.map.center.longitude;
            
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

            var promise = apiHandler.newEvent($scope.event);

            promise.then(function (response) {
                console.log("Response:");
                console.log(response);

                $scope.returnedEvent = response.data;
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $ionicHistory.nextViewOptions({disableBack: 'true'});
              
                //$scope.returnedEvent = {'id': 61};  
                $scope.compartirEvento();


            });
            
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

        // End create event function

        uiGmapGoogleMapApi.then(function(maps) {
            $scope.map = {
                center: { latitude: $rootScope.lat, longitude: $rootScope.lng },
                zoom: 15,
                options: { mapTypeControl: false, streetViewControl: false, mapTypeId: maps.MapTypeId.ROADMAP }
            };
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
              $scope.event.direction = "Mi ubicacion";
              $ionicScrollDelegate.scrollTop();
            }, function (err) {
              $rootScope.showLoader(false);  
              $ionicPopup.alert({
                title: 'Error de localizacion!',
                template: 'No esta activa la localizacion'
              });
            });
        }

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
    .controller('CanchasCtrl', function($rootScope, $localStorage, $scope, apiHandler, $state) {

        var user = $localStorage.get('user',{}, true);
        var promise = apiHandler.listCancha(data);

        promise.then(function (response) {
            console.log("Response:");
            console.log(response);

            if (response.error != 0) {
                // TODO: throw popup
                $rootScope.error('Ocurrió un error en la operación.');
                window.history.back();
            } else {
                $scope.canchas = response.data;
                $scope.canchas = [
                    {
                        id: 1,
                        name: 'cancha de prueba',
                        descripcion: 'prueba de descripcion de cancha',
                        hora_inicio: new Date('time short'),
                        hora_fin: new Date('time short'),
                        dias_disponibles: '0:0:0:0:0:0:0',
                        precio: 150.00,
                        is_public: true,
                        tipo_pago: '0:0:0'
                    },
                    {
                        id: 2,
                        name: 'cancha de prueba 2',
                        descripcion: 'prueba de descripcion de cancha 2',
                        hora_inicio: new Date('time short'),
                        hora_fin: new Date('time short'),
                        dias_disponibles: '0:0:0:0:0:0:0',
                        precio: 200.00,
                        is_public: true,
                        tipo_pago: '0:0:0'
                    },
                ];
            }
        });
        
    })    
    .controller('CanchaCtrl', function($rootScope, $scope, $stateParams, apiHandler, $state) {
        var canchaId = $stateParams["canchaId"];

        var data = {"canchaId": canchaId};
        $scope.canchaId = canchaId;

        var promise = apiHandler.viewCanchas(data);
        promise.then(function (result) {
            if (result.error != 0) {
                $rootScope.error(
                    $rootScope.getErrorDescription(result.error)
                );
            } else {
                $scope.cancha = result.data;
                $scope.canchas = [
                    {
                        id: 1,
                        name: 'cancha de prueba',
                        descripcion: 'prueba de descripcion de cancha',
                        hora_inicio: new Date('time short'),
                        hora_fin: new Date('time short'),
                        dias_disponibles: '0:0:0:0:0:0:0',
                        precio: 150.00,
                        is_public: true,
                        tipo_pago: '0:0:0'
                    },
                    {
                        id: 2,
                        name: 'cancha de prueba 2',
                        descripcion: 'prueba de descripcion de cancha 2',
                        hora_inicio: new Date('time short'),
                        hora_fin: new Date('time short'),
                        dias_disponibles: '0:0:0:0:0:0:0',
                        precio: 200.00,
                        is_public: true,
                        tipo_pago: '0:0:0'
                    },
                ];
                $scope.cancha = $scope.canchas[canchaId-1];
            }
        });
        
    })    
;


