var regApp=angular.module("regApp",["ngSanitize","ngCookies","ngRoute","firebase","chart.js"]).constant("FIREBASE_URL","https://regapp-9f43d.firebaseio.com/");regApp.run(["$rootScope","$location",function($rootScope,$location){$rootScope.$on("$routeChangeError",function(event,next,previous,error){"AUTH_REQUIRED"==error&&($rootScope.message="Sorry, you must be logged in to access this page.",$location.path("/login"))})}]),regApp.config(["$routeProvider",function($routeProvider){$routeProvider.when("/home",{templateUrl:"views/home.html",controller:"HomePageController"}).when("/search",{templateUrl:"views/results.html",controller:"SearchController"}).when("/login",{templateUrl:"views/login.html",controller:"RegistrationController"}).when("/register",{templateUrl:"views/register.html",controller:"RegistrationController"}).when("/product/:productId",{templateUrl:"views/product.html",controller:"ProductController"}).when("/wishlist",{templateUrl:"views/wishlist.html",controller:"WishListController"}).when("/success",{templateUrl:"views/home.html",controller:"HomePageController",resolve:{currentAuth:function(Authentication){return Authentication.requireAuth()}}}).otherwise({redirectTo:"/home"})}]),regApp.controller("HomePageController",["$scope",function($scope){$scope.isFocused=!1,$scope.labels=["Useful","Natural","Moisturizing","Anti-age","Silicons","Acne Treatment","UV proctection"],$scope.data=[5,3,2,1,1,1,1,0],$scope.labels1=["Safe","Possible allergens"],$scope.data1=[12,2]}]),regApp.controller("ProductController",["searchService","visualization","userPersistence","$rootScope","$scope","$firebaseArray","$location",function(searchService,visualization,userPersistence,$rootScope,$scope,$firebaseArray,$location){function getPid(location){var lastSlashIndex=location.path().lastIndexOf("/");return location.path().substring(lastSlashIndex+1)}function getWishList(currentUser){var wishlistRef=firebase.database().ref().child("wishlist/"+currentUser.uid);return $firebaseArray(wishlistRef)}function displayProduct(pid){searchService.getProduct(pid).then(function(currentProduct){currentProduct.ingredientslist=currentProduct.ingredients.all,$scope.currentProduct=currentProduct,$scope.ingredientslist=currentProduct.ingredientslist,$scope.category={acne:"acne",age:"age",allergens:"allergens",moisturizing:"moisturizing",natural:"natural",silicones:"silicones",useful:"useful",uv:"uv"},$scope.highlight=function(categoryName){var category=currentProduct.ingredients[categoryName];category=visualization.splitIngredients(category);for(var allIngredients=visualization.splitIngredients(currentProduct.ingredientslist),i=0;i<category.length;i++)for(var j=0;j<allIngredients.length;j++)category[i]===allIngredients[j]&&(allIngredients[j]='<span class="highlight">'+allIngredients[j]+"</span>");$scope.ingredientslist=allIngredients.join(", ")};var ingredientsDonut=visualization.preprocessShares(currentProduct.ingredients);$scope.labels=ingredientsDonut.labels,$scope.data=ingredientsDonut.sizes;var safetyDonut=visualization.preprocessSafeness(currentProduct.ingredients);console.log(safetyDonut.labels),console.log(safetyDonut.data),$scope.labels2=ingredientsDonut.labels,$scope.data2=ingredientsDonut.sizes})}$scope.addProduct=function(currentProduct){$scope.wishlist.$add({pid:pid,title:currentProduct.fullname,img:currentProduct.url})},angular.isDefined($scope.currentUser)?$scope.wishlist=getWishList($scope.currentUser):$scope.wishlist={};var pid=getPid($location);displayProduct(pid)}]),regApp.controller("RegistrationController",["$scope","Authentication",function($scope,Authentication){$scope.login=function(){Authentication.login($scope.user)},$scope.logout=function(){Authentication.logout()},$scope.register=function(){Authentication.register($scope.user)}}]),regApp.controller("SearchController",["searchService","$rootScope","$scope","$firebaseObject","$location",function(searchService,$rootScope,$scope,$firebaseObject,$location){$scope.searchService=searchService,$scope.isFocused=!0,$scope.searchResults=[],$scope.searchResults=$scope.searchService.results,$scope.doSearch=function(){var results=$scope.searchService.search($scope.q);console.log("returned from search"),$scope.searchResults=results.then(function(data){return data})},$scope.data={skinOptions:[{id:0,name:"All skin types",value:""},{id:1,name:"Dry skin",value:"dry"},{id:2,name:"Normal skin",value:"normal"},{id:3,name:"Combination skin",value:"combination"}],typeOptions:[{id:0,name:"All product types",value:""},{id:1,name:"Cleanser",value:"cleanser"},{id:2,name:"Cream",value:"cream"}]},$scope.selectedSkinOption=$scope.data.skinOptions[0],$scope.selectedTypeOption=$scope.data.typeOptions[0],$scope.filterBySkin=function(selected){var option=$scope.data.skinOptions[selected.id].value,filtered=[],queryResults=$scope.searchService.getQueryResults;if(""==option)filtered=queryResults;else for(var len=queryResults.length,i=0;len>i;i++){var current=queryResults[i];-1!=current.skin.indexOf(option)&&filtered.push(current)}console.log(filtered),$scope.searchService.updateResults(filtered)},$scope.filterByType=function(selected){var option=$scope.data.typeOptions[selected.id].value,filtered=[],queryResults=$scope.searchService.getQueryResults;if(""==option)filtered=queryResults;else for(var len=queryResults.length,i=0;len>i;i++){var current=queryResults[i];-1!=current.type.indexOf(option)&&filtered.push(current)}console.log(filtered),$scope.searchService.updateResults(filtered)}}]),regApp.controller("WishListController",["$scope","$rootScope","$firebaseArray",function($scope,$rootScope,$firebaseArray){var wishlistRef=firebase.database().ref().child("wishlist/"+$rootScope.currentUser.uid);$scope.wishlist=$firebaseArray(wishlistRef),$scope.remove=function(item){console.log("removed "+item),$scope.wishlist.$remove(item)}}]),regApp.directive("focus",["$timeout","$parse",function($timeout,$parse){return{link:function(scope,element,attrs){var model=$parse(attrs.focus);scope.$watch(model,function(value){value===!0?$timeout(function(){element[0].focus()}):value===!1&&$timeout(function(){element[0].blur()})}),element.bind("blur",function(){scope.$apply(model.assign(scope,!1))})}}}]),regApp.factory("Authentication",["$rootScope","$firebaseAuth","$firebaseObject","$location",function($rootScope,$firebaseAuth,$firebaseObject,$location){var auth=$firebaseAuth();auth.$onAuthStateChanged(function(authUser){authUser?$rootScope.currentUser=authUser:$rootScope.currentUser=""});var authObject={login:function(user){auth.$signInWithEmailAndPassword(user.email,user.password).then(function(regUser){$rootScope.message="Welcome to SmartIngridients",$location.path("/success")})["catch"](function(error){$rootScope.message=error.message,$location.path("/login")})},logout:function(){return auth.$signOut()},requireAuth:function(){return auth.$requireSignIn()},register:function(user){auth.$createUserWithEmailAndPassword(user.email,user.password).then(function(regUser){regUser.updateProfile({displayName:user.fname+" "+user.lname}).then(function(){authObject.login(user)},function(error){$rootScope.message=error.message})})["catch"](function(error){$rootScope.message=error.message})}};return authObject}]),regApp.factory("searchService",["$firebaseObject","$q","$firebaseArray","$location",function($firebaseObject,$q,$firebaseArray,$location){function capitalizeFirst(string){return console.log(string),string.charAt(0).toUpperCase()+string.slice(1)}function mkResult(data){var values=data.val(),result=new Object;return result.fullname=values.fullname,result.category=values.category,result.skin=values.skin,result.thumbnail=values.url,result.size=values.size,result.brand=values.brand,result.description=values.description,result.fullsize=values.fullsize,result.type=values.type,result.ingredientslist=values.ingredients.all,result.ingredients=values.ingredients,result.amazon=values.amazon,result.id=data.key,result}function doCategorySearch(defer){var productsRef=firebase.database().ref().child("products"),query=productsRef.orderByChild("crueltyfree");query.once("value",function(snapshot){var new_results=[];snapshot.forEach(function(data){"yes"===data.val().crueltyfree&&new_results.push(mkResult(data))}),angular.copy(new_results,results),angular.copy(new_results,copyResults),console.log("resolving results"),defer.resolve(new_results)},function(errors){console.log("The read failed: "+errors.code)})}function doBrandSearch(string,defer){var productsRef=firebase.database().ref().child("products"),query=productsRef.orderByChild("brand");query.once("value",function(snapshot){var new_results=[],qCap=capitalizeFirst(string);snapshot.forEach(function(data){data.key.startsWith(qCap)&&new_results.push(mkResult(data))}),angular.copy(new_results,results),angular.copy(new_results,copyResults),console.log("resolving results"),defer.resolve(new_results)},function(errors){console.log("The read failed: "+errors.code)})}function search(qry){var query=qry.toLowerCase(),defer=$q.defer();return productCategories.indexOf(query)>=0?(console.log("catefory = "+qry),doCategorySearch(defer)):(console.log("brand = "+qry),doBrandSearch(query,defer)),defer.promise}function getProduct(pid){var defer=$q.defer(),productRef=firebase.database().ref().child("products"),query=productRef.orderByChild("brand");return query.once("value",function(snapshot){snapshot.forEach(function(data){data.key===pid&&defer.resolve(data.val())})},function(errors){console.log("The read failed: "+errors.code)}),defer.promise}function updateResults(new_results){angular.copy(new_results,results)}var results=[],copyResults=[],productCategories=["cruelty free"];return{results:results,search:search,getProduct:getProduct,updateResults:updateResults,getQueryResults:copyResults}}]),regApp.factory("userPersistence",["$cookies",function($cookies){return{setCookieData:function(currentUser){currentUserString=JSON.stringify(currentUser),$cookies.put("currentUser",currentUserString)},getCookieData:function(){var currentUserString=$cookies.get("currentUser"),currentUser=JSON.parse(currentUserString);return currentUser},clearCookieData:function(){$cookies.remove("currentUser")}}}]),regApp.factory("visualization",["$firebaseObject","$location",function($firebaseObject,$location){var mkIngredientsShares=function(ingredients){var ingredientsShares=[];return angular.forEach(ingredients,function(value,key){if("all"!==key&&""!==value){var pair={label:key,size:splitIngredients(value).length};this.push(pair)}},ingredientsShares),ingredientsShares},splitIngredients=function(str){return str.split(",").map(function(str){return str.trim()})},visualize={preprocessShares:function(ingredients){for(var shares=mkIngredientsShares(ingredients),labels=shares.map(function(pair){return pair.label}),sizes=shares.map(function(pair){return pair.size}),i=0;i<labels.length;i++)"acne"===labels[i]?labels[i]="Anti-"+labels[i]:"age"===labels[i]?labels[i]="Anti-"+labels[i]:"uv"===labels[i]?labels[i]=labels[i].charAt(0).toUpperCase()+labels[i].slice(1)+"-protection":labels[i]=labels[i].charAt(0).toUpperCase()+labels[i].slice(1);return{labels:labels,sizes:sizes}},preprocessSafeness:function(ingredients){console.log(ingredients);var allergenesList=splitIngredients(ingredients.allergens),allergenesSize=allergenesList.length,safeIngredients=splitIngredients(ingredients.all).filter(function(x){return allergenesList.indexOf(x)<0}),safeIngredientsSize=safeIngredients.length;return{labels:["safe","dangerous"],data:[safeIngredientsSize,allergenesSize]}},splitIngredients:splitIngredients};return visualize}]);