regApp.factory('Authentication', ['$rootScope', '$firebaseAuth', '$firebaseObject','$location', 'FIREBASE_URL',
	function($rootScope, $firebaseAuth, $firebaseObject, $location, FIREBASE_URL){

		var ref = new Firebase(FIREBASE_URL);
		var auth = $firebaseAuth(ref);

		auth.$onAuth(function(authUser){
			console.log($rootScope);
			if(authUser){
				var userRef = new Firebase(FIREBASE_URL + 'users/' + authUser.uid);
				var userObj = $firebaseObject(userRef);
				$rootScope.currentUser = userObj; 
			} else {
				$rootScope.currentUser = ''; 
				//$location.path('/login');
			}
		});

		var authObject = {
			login: function(user){
				auth.$authWithPassword({
					email: user.email,
					password: user.password
				}).then(function(regUser){
					$rootScope.message = "Welcome to SmartIngridients";
					$location.path('/success');
				}).catch(function(error){
					$rootScope.message = error.message;
					$location.path('/login');
				});
			},//login

			logout: function(){
				return auth.$unauth();
			},//logout

			requireAuth: function(){
				return auth.$requireAuth();
			},//require Authentication

			register: function(user){
				auth.$createUser({
					email: user.email, 
					password: user.password
				}).then(function(regUser){

					var regRef = new Firebase(FIREBASE_URL + 'users')
					.child(regUser.uid).set({
						date: Firebase.ServerValue.TIMESTAMP,
						regUser: regUser.uid,
						firstname: user.fname,
						lastname: user.lname,
						email: user.email
					});//user info
					authObject.login(user);

				}).catch(function(error){
					$rootScope.message = error.message;
				});//create user
			}//register
		};
		return authObject;
}]);//factory

