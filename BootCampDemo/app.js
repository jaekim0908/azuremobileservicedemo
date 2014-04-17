//var client = new WindowsAzure.MobileServiceClient(
//                        "YOUR MOBILE SERVICE URL HERE",
//                        "YOUR APPLICATION KEY HERE");
var client = new WindowsAzure.MobileServiceClient(
    "https://azurebootcamp2014.azure-mobile.net/",
    "ALMrOcOwmVrsmtGGCYjcaOchPoARTd79"
    );
var map = null;
var userLocation = null;
var place = null;
var LoginOptions = {
    MICROSOFT: "microsoftaccount",
    GOOGLE: "google",
    FACEBOOK: "facebook",
    TWITTER: "twitter",
    AZURE_ACTIVE_DIRECTORY: "windowsazureactivedirectory"
};

function refreshAuthDisplay() {
    if ( sessionStorage.loggedInUser ) {
        client.currentUser = JSON.parse( sessionStorage.loggedInUser );
    }
    var isLoggedIn = client.currentUser !== null;
    console.log( "client.currentUser = ", JSON.stringify( client.currentUser ) );
    $( "#sign-out" ).toggle( isLoggedIn );

    if ( isLoggedIn ) {
        $( "#login-name" ).text( client.currentUser.userId );
        GetMap();
        $( "#map-canvas" ).toggle( true );
        $( "#post" ).removeAttr( "disabled" );
    }
    else {
        $( "#post" ).attr( "disabled", "disabled" );
    }
}

function logIn( loginAccount ) {

    if ( sessionStorage.loggedInUser ) {
        client.currentUser = JSON.parse( sessionStorage.loggedInUser );
        refreshAuthDisplay();
    }
    else {
        client.login( loginAccount ).done( function ( results ) {
            alert( "You are now logged in as: " + results.userId );
            sessionStorage.loggedInUser = JSON.stringify( client.currentUser );
            refreshAuthDisplay();
        }, function ( err ) {
                console.error( "Log in Error: " + err );
            });
    }
}

function logOut() {
    client.logout();
    delete sessionStorage.loggedInUser;
    $( "#map-canvas" ).toggle( false );
    refreshAuthDisplay();
}

function GetMap() {

    if ( navigator.geolocation ) {
        navigator.geolocation.getCurrentPosition( locateSuccess, locateFail );
    }
    else {
        alert( 'Geo location is not supported' );
    }

    Microsoft.Maps.loadModule( 'Microsoft.Maps.Themes.BingTheme', { callback: themesModuleLoaded });
}

function themesModuleLoaded() {
    // Load the map using the Bing theme style.
    map = new Microsoft.Maps.Map( document.getElementById( "map-canvas" ), {
        credentials: "AvXb0M3CEYHOkLKJCr9tGJyXLzuTbi8hqLPCkLB7Cd6MvvYXMytLru8-Ykm5iRN2",
        center: new Microsoft.Maps.Location( 45.5, -122.5 ),
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        zoom: 13,
        theme: new Microsoft.Maps.Themes.BingTheme()
    });
}

function locateSuccess( loc ) {
    place = loc;
    userLocation = new Microsoft.Maps.Location( loc.coords.latitude, loc.coords.longitude );
    map.setView( { center: userLocation, zoom: 13 });
    client.invokeApi( "getmessagesbylocation", {
        method: "GET",
        parameters: {
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
            distance: 10000
        }
    }).done( function ( results ) {
            console.log( "results = ", results.result.length );
            if ( results.result !== null ) {
                for ( var i = 0; i < results.result.length; i++ ) {
                    var messageLocation = new Microsoft.Maps.Location( results.result[i].latitude, results.result[i].longitude );
                    var newPin = new Microsoft.Maps.Pushpin( messageLocation );
                    var pinInfobox = new Microsoft.Maps.Infobox( messageLocation, { pushpin: newPin, title: results.result[i].text });

                    map.entities.push( newPin );
                    map.entities.push( pinInfobox );
                }
            }
        }, function ( err ) {
            alert( "Error: " + err );
        });
}

function locateFail( geoPositionError ) {
    switch ( geoPositionError.code ) {
        case 0: //unkown error
            alert( 'an unknown error occurred. sorry' );
            break;
        case 1:
            alert( 'permission to use geolocation was denied' );
            break;
        case 2:
            alert( 'the geolocation request took too long and timed out' );
            break;
        default:
            break;
    }
}

function drawCircle( loc ) {
    var radius = 100;
    var R = 6378137;
    var lat = ( loc.latitude * Math.PI ) / 180;
    var lon = ( loc.longitude * Math.PI ) / 180;
    var d = parseFloat( radius ) / R;
    var locs = new Array();
    for ( x = 0; x <= 360; x++ ) {
        var p = new Microsoft.Maps.Location();
        brng = x * Math.PI / 180;
        p.latitude = Math.asin( Math.sin( lat ) * Math.cos( d ) + Math.cos( lat ) * Math.sin( d ) * Math.cos( brng ) );
        p.longitude = ( ( lon + Math.atan2( Math.sin( brng ) * Math.sin( d ) * Math.cos( lat ), Math.cos( d ) - Math.sin( lat ) * Math.sin( p.latitude ) ) ) * 180 ) / Math.PI;
        p.latitude = ( p.latitude * 180 ) / Math.PI;
        locs.push( p );
    }
    return new Microsoft.Maps.Polygon( locs, { fillColor: new Microsoft.Maps.Color( 125, 0, 0, 255 ), strokeColor: new Microsoft.Maps.Color( 0, 0, 0, 255 ) });
}

function insertComment( msg ) {
    $( "#userComment" ).val( "" );
    var newLongitude = Math.round( ( place.coords.longitude + Math.random() * 0.05 ) * 10000 ) / 10000;
    var newLatitude = Math.round( ( place.coords.latitude + Math.random() * 0.05 ) * 10000 ) / 10000;;
    var item = {
        text: msg,
        longitude: newLongitude.toString(),
        latitude: newLatitude.toString()
    }
    var itemTable = client.getTable( "Item" );
    itemTable.insert( item ).done( function ( inserted ) {
        var newMessageLocation = new Microsoft.Maps.Location( newLatitude, newLongitude );
        var newPin = new Microsoft.Maps.Pushpin( newMessageLocation );
        var pinInfobox = new Microsoft.Maps.Infobox( newMessageLocation, { pushpin: newPin, title: msg });
        map.entities.push( newPin );
        map.entities.push( pinInfobox );
        map.setView( { center: newMessageLocation, zoom: 15 });
    }, function ( err ) {
            alert( "Error in inserting comment", err );
        });
}

// On page init, fetch the data and set up event handlers
$( document ).ready( function () {
    $( "#map-canvas" ).toggle( false );
    refreshAuthDisplay();
    $( "#sign-out" ).click( logOut );
    $( "#sign-in-msft" ).click( function ( event ) {
        logIn( LoginOptions.MICROSOFT );
    });
    $( "#sign-in-google" ).click( function ( event ) {
        logIn( LoginOptions.GOOGLE );
    });
    $( "#sign-in-aad" ).click( function ( event ) {
        logIn( LoginOptions.AZURE_ACTIVE_DIRECTORY );
    });
    $( "#submitComment" ).click( $( "#userComment" ), function ( event ) {
        insertComment( event.data.val() );
    });
});