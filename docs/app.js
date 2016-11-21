var regApp=angular.module("regApp",["ngSanitize","ngCookies","ngRoute","firebase","chart.js"]).constant("FIREBASE_URL","https://regapp-9f43d.firebaseio.com/");regApp.run(["$rootScope","$location",function($rootScope,$location){$rootScope.$on("$routeChangeError",function(event,next,previous,error){"AUTH_REQUIRED"==error&&($rootScope.message="Sorry, you must be logged in to access this page.",$location.path("/login"))})}]),regApp.config(["$routeProvider",function($routeProvider){$routeProvider.when("/home",{templateUrl:"views/home.html"}).when("/search",{templateUrl:"views/results.html",controller:"SearchController"}).when("/login",{templateUrl:"views/login.html",controller:"RegistrationController"}).when("/register",{templateUrl:"views/register.html",controller:"RegistrationController"}).when("/product/:productId",{templateUrl:"views/product.html",controller:"ProductController"}).when("/wishlist",{templateUrl:"views/wishlist.html",controller:"WishListController"}).when("/success",{templateUrl:"views/success.html",controller:"SuccessController",resolve:{currentAuth:function(Authentication){return Authentication.requireAuth()}}}).otherwise({redirectTo:"/home"})}]),regApp.controller("ProductController",["searchService","visualization","userPersistence","$rootScope","$scope","$firebaseArray","$location",function(searchService,visualization,userPersistence,$rootScope,$scope,$firebaseArray,$location){function getPid(location){var lastSlashIndex=location.path().lastIndexOf("/");return location.path().substring(lastSlashIndex+1)}function getWishList(currentUser){var wishlistRef=firebase.database().ref().child("wishlist/"+currentUser.uid);return $firebaseArray(wishlistRef)}function displayProduct(pid){searchService.getProduct(pid).then(function(currentProduct){currentProduct.ingredientslist=currentProduct.ingredients.all,$scope.currentProduct=currentProduct,$scope.ingredientslist=currentProduct.ingredientslist,$scope.category={acne:"acne",age:"age",allergens:"allergens",moisturizing:"moisturizing",natural:"natural",silicones:"silicones",useful:"useful",uv:"uv"},$scope.highlight=function(categoryName){var category=currentProduct.ingredients[categoryName];category=visualization.splitIngredients(category);for(var allIngredients=visualization.splitIngredients(currentProduct.ingredientslist),i=0;i<category.length;i++)for(var j=0;j<allIngredients.length;j++)category[i]===allIngredients[j]&&(allIngredients[j]='<span class="highlight">'+allIngredients[j]+"</span>");$scope.ingredientslist=allIngredients.join(", ")};var donutData=visualization.preprocessShares(currentProduct.ingredients);$scope.labels=donutData.labels,$scope.data=donutData.sizes})}$scope.addProduct=function(currentProduct){$scope.wishlist.$add({pid:pid,title:currentProduct.fullname,img:currentProduct.url})},angular.isDefined($scope.currentUser)?($scope.wishlist=getWishList($scope.currentUser),console.log("here42")):($scope.wishlist={},console.log("here43"));var pid=getPid($location);displayProduct(pid)}]),regApp.controller("RegistrationController",["$scope","Authentication",function($scope,Authentication){$scope.login=function(){Authentication.login($scope.user)},$scope.logout=function(){Authentication.logout()},$scope.register=function(){Authentication.register($scope.user)}}]),regApp.controller("SearchController",["searchService","$scope","$firebaseObject","$location",function(searchService,$scope,$firebaseObject,$location){$scope.searchService=searchService,$scope.searchService.results=searchService.results,$scope.doSearch=function(){$scope.searchService.search($scope.q)}}]),regApp.controller("SuccessController",["$scope",function($scope){}]),regApp.controller("WishListController",["$scope","$rootScope","$firebaseArray",function($scope,$rootScope,$firebaseArray){var wishlistRef=firebase.database().ref().child("wishlist/"+$rootScope.currentUser.uid);$scope.wishlist=$firebaseArray(wishlistRef),$scope.remove=function(item){console.log("removed "+item),$scope.wishlist.$remove(item)}}]),regApp.factory("Authentication",["$rootScope","$firebaseAuth","$firebaseObject","$location",function($rootScope,$firebaseAuth,$firebaseObject,$location){var auth=$firebaseAuth();auth.$onAuthStateChanged(function(authUser){authUser?$rootScope.currentUser=authUser:$rootScope.currentUser=""});var authObject={login:function(user){auth.$signInWithEmailAndPassword(user.email,user.password).then(function(regUser){$rootScope.message="Welcome to SmartIngridients",$location.path("/success")})["catch"](function(error){$rootScope.message=error.message,$location.path("/login")})},logout:function(){return auth.$signOut()},requireAuth:function(){return auth.$requireSignIn()},register:function(user){auth.$createUserWithEmailAndPassword(user.email,user.password).then(function(regUser){regUser.updateProfile({displayName:user.fname+" "+user.lname}).then(function(){authObject.login(user)},function(error){$rootScope.message=error.message})})["catch"](function(error){$rootScope.message=error.message})}};return authObject}]),regApp.factory("searchService",["$firebaseObject","$q","$firebaseArray","$location",function($firebaseObject,$q,$firebaseArray,$location){function search(q){var productsRef=firebase.database().ref().child("products"),query=productsRef.orderByChild("brand");query.once("value",function(snapshot){var new_results=[];snapshot.forEach(function(data){if(data.key.startsWith(q)){var values=data.val(),result=new Object;result.fullname=values.fullname,result.category=values.category,result.skin=values.skin,result.thumbnail=values.url,result.size=values.size,result.brand=values.brand,result.description=values.description,result.fullsize=values.fullsize,result.type=values.type,result.ingredientslist=values.ingredients.all,result.ingredients=values.ingredients,result.id=data.key,new_results.push(result)}}),angular.copy(new_results,results)},function(errors){console.log("The read failed: "+errors.code)})}function getProduct(pid){var defer=$q.defer(),productRef=firebase.database().ref().child("products");console.log("bar");var query=productRef.orderByChild("brand");return query.once("value",function(snapshot){console.log("here"),snapshot.forEach(function(data){data.key===pid&&defer.resolve(data.val())})},function(errors){console.log("The read failed: "+errors.code)}),defer.promise}var results=[];return{results:results,search:search,getProduct:getProduct}}]),regApp.factory("userPersistence",["$cookies",function($cookies){return{setCookieData:function(currentUser){currentUserString=JSON.stringify(currentUser),$cookies.put("currentUser",currentUserString)},getCookieData:function(){var currentUserString=$cookies.get("currentUser"),currentUser=JSON.parse(currentUserString);return currentUser},clearCookieData:function(){$cookies.remove("currentUser")}}}]),regApp.factory("visualization",["$firebaseObject","$location",function($firebaseObject,$location){var mkIngredientsShares=function(ingredients){var ingredientsShares=[];return angular.forEach(ingredients,function(value,key){if("all"!==key&&""!==value){var pair={label:key,size:splitIngredients(value).length};this.push(pair)}},ingredientsShares),ingredientsShares},splitIngredients=function(str){return str.split(",").map(function(str){return str.trim()})},visualize={preprocessShares:function(ingredients){for(var shares=mkIngredientsShares(ingredients),labels=shares.map(function(pair){return pair.label}),sizes=shares.map(function(pair){return pair.size}),i=0;i<labels.length;i++)"acne"===labels[i]?labels[i]="Anti-"+labels[i]:"age"===labels[i]?labels[i]="Anti-"+labels[i]:"uv"===labels[i]?labels[i]=labels[i].charAt(0).toUpperCase()+labels[i].slice(1)+"-protection":labels[i]=labels[i].charAt(0).toUpperCase()+labels[i].slice(1);return{labels:labels,sizes:sizes}},splitIngredients:splitIngredients};return visualize}]);