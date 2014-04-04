var client = new WindowsAzure.MobileServiceClient(
                        "https://jkmobileservice.azure-mobile.net/",
                        "igrhDCBgNDHWlggSIAYmAZSlXTllup93");
var map = null;
var userLocation = null;
var place = null;

function refreshAuthDisplay() {
    if (sessionStorage.loggedInUser) {
        client.currentUser = JSON.parse(sessionStorage.loggedInUser);
    }
    var isLoggedIn = client.currentUser !== null;
    console.log("isLoggedIn = ", isLoggedIn);
    console.log("client.currentUser = ", JSON.stringify(client.currentUser));
    $("#sign-in").toggle(!isLoggedIn);
    $("#sign-out").toggle(isLoggedIn);

    if (isLoggedIn) {
        $("#login-name").text(client.currentUser.userId);
        GetMap();
        $("#map-canvas").toggle(true);
        $("#post").removeAttr("disabled");
    }
    else {
        $("#post").attr("disabled", "disabled");
    }
}

function logIn() {

    if (sessionStorage.loggedInUser) {
        console.log("user's session has been saved");
        client.currentUser = JSON.parse(sessionStorage.loggedInUser);
        refreshAuthDisplay();
    }
    else {
        client.login("google").done(function (results) {
            alert("You are now logged in as: " + results.userId);
            console.log("current user = ", JSON.stringify(client.currentUser));
            sessionStorage.loggedInUser = JSON.stringify(client.currentUser);
            refreshAuthDisplay();
        }, function (err) {
            alert("Log in Error: " + err);
        });
    }
}

function logOut() {
    client.logout();
    delete sessionStorage.loggedInUser;
    $("#map-canvas").toggle(false);
    refreshAuthDisplay();
}

function GetMap() {

    map = new Microsoft.Maps.Map(document.getElementById("map-canvas"), {
        credentials: "AvXb0M3CEYHOkLKJCr9tGJyXLzuTbi8hqLPCkLB7Cd6MvvYXMytLru8-Ykm5iRN2",
        center: new Microsoft.Maps.Location(45.5, -122.5),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: 7
    });
    //var center = map.getCenter();
    //var pin = new Microsoft.Maps.Pushpin(center, { text: '1', draggable: true });
    //map.entities.push(pin);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locateSuccess, locateFail);
    }
    else {
        alert('Geo location is not supported');
    }
}

function locateSuccess(loc) {
    place = loc;
    userLocation = new Microsoft.Maps.Location(loc.coords.latitude, loc.coords.longitude);
    map.setView({ center: userLocation, zoom: 10 });
    //var locationArea = drawCircle(userLocation);
    //var pin = new Microsoft.Maps.Pushpin(userLocation, { text: '1', draggable: false });
    //map.entities.push(pin);
    //map.entities.push(locationArea);
    var item = { text: "Awesome item10",
        userName: "Jae Kim2",
        imageName: "my dog2",
        longitude: loc.coords.longitude.toString(),
        latitude: loc.coords.latitude.toString()
    }
    var itemTable = client.getTable("Item");
    itemTable.insert(item);
    client.invokeApi("getmessagesbylocation", {
        body: null,
        method: "GET",
        parameters: {
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
            distance: 100000
        }
    }).done(function (results) {
        console.log("results = ", results.result.length);
        for (var i = 0; i < results.result.length; i++) {
            //console.log("result = " + results.result[i].longitude + " " + results.result[i].latitude + " " + results.result[i].text);
            var messageLocation = new Microsoft.Maps.Location(results.result[i].latitude, results.result[i].longitude);
            var newPin = new Microsoft.Maps.Pushpin(messageLocation, {
                text: results.result[i].userName,
                draggable: false,
                typeName: results.result[i].id
            });
            map.entities.push(newPin);
            $('.' + results.result[i].id).children().attr('title', results.result[i].text);
        }
    }, function (err) {
        alert("Error: " + err);
    });

    //var query = itemTable.read().done(function (results) {
    //    alert(JSON.stringify(results));
    //}, function (err) {
    //    alert("Error: " + err);
    //});
}

function locateFail(geoPositionError) {
    switch (geoPositionError.code) {
        case 0: //unkown error
            alert('an unknown error occurred. sorry');
            break;
        case 1:
            alert('permission to use geolocation was denied');
            break;
        case 2:
            alert('the geolocation request took too long and timed out');
            break;
        default:
            break;
    }
}
function drawCircle(loc) {
    var radius = 100;
    var R = 6378137;
    var lat = (loc.latitude * Math.PI) / 180;
    var lon = (loc.longitude * Math.PI) / 180;
    var d = parseFloat(radius) / R;
    var locs = new Array();
    for (x = 0; x <= 360; x++) {
        var p = new Microsoft.Maps.Location();
        brng = x * Math.PI / 180;
        p.latitude = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(brng));
        p.longitude = ((lon + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat), Math.cos(d) - Math.sin(lat) * Math.sin(p.latitude))) * 180) / Math.PI;
        p.latitude = (p.latitude * 180) / Math.PI;
        locs.push(p);
    }
    return new Microsoft.Maps.Polygon(locs, { fillColor: new Microsoft.Maps.Color(125, 0, 0, 255), strokeColor: new Microsoft.Maps.Color(0, 0, 0, 255) });
}

function insertComment(msg) {
    alert("inserting comment");
    var item2 = {
        text: "Happy coding !!!2",
        userName: "Michael Jordon2",
        imageName: "my cat2",
        longitude: place.coords.longitude.toString(),
        latitude: place.coords.latitude.toString()
    }
    var itemTable = client.getTable("Item");
    itemTable.insert(item2);
}

console.log("calling refreshAuthDisplay");
// On page init, fetch the data and set up event handlers
$(document).ready(function () {
    $("#map-canvas").toggle(false);
    refreshAuthDisplay();
    $('#summary').html('<strong>You must login to access data.</strong>');
    $("#sign-out").click(logOut);
    $("#sign-in").click(logIn);
    $("#submitComment").click(insertComment);
});