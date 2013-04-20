
/**
* Main router for the app
*/
var User = require( '../modules/account-manager' )
,   Message = require( '../modules/message' )
,   crypto = require( 'crypto' )
,   events = require( 'events' )
,   utils = require( '../modules/utils' );


/**
* Entrance
* @uses `User` & `crypto`
*/
function Entrance( req, res ) {

    // Config
    this.config = {
            cookieName: '_entrance_loggedin'
        ,   expiration: new Date( Date.now() + 9000000 )
    }

    // Response
    this.res = res;

    // Request
    this.req = req;

};


// Event emitter
Entrance.prototype = new events.EventEmitter;


/**
* Parses the logged in cookie
* @return { object } auth cookie object
*/
Entrance.prototype.parseAuthCookie = function() {

    var cookie = this.req.cookies[ this.config.cookieName ]
    ,   elements;

    if ( typeof cookie == 'undefined' ) return false;
    elements = cookie.split( '|' );

    if( elements.length != 3 ) return false;

    // Return cookie elements
    return { username: elements[ 0 ], expiration: elements[ 1 ], key: elements[ 2 ] };

}

/**
* Checks whether the auth cookie is valid
*/
Entrance.prototype.validateAuthCookie = function() {

    var cookie = this.parseAuthCookie()
    ,   time = new Date()
    ,   _this = this
    ,   pFrag
    ,   pass
    ,   key;


    // Check expiration
    if( cookie == false ) return _this.emit( 'notLoggedIn', 'Cookie not set.' );
    if( cookie.expiration < time.getTime() ) {
        return _this.emit( 'notLoggedIn', 'Expired Cookie.')
    }

    // Get user referenced in cookie
    User.findByUsername( cookie.username, function( err, user ) {

        // Error
        if ( err || ! user ) return _this.emit( 'notLoggedIn', 'No users found' );

        // Get
        pFrag = user.password.substr( 8, 12 );
        key = utils.hash( cookie.username + '|' + pFrag + '|' + cookie.expiration );

        if ( key == cookie.key ) {
            return _this.emit( 'loggedIn', user );

        } else {
            return _this.emit( 'notLoggedIn', 'Malformed cookie.' );
        }

    });

}


/**
* Logs a user in
* @param { object } user credentials
*/
Entrance.prototype.login = function( creds ) {

    var login
    ,   _this = this
    ,   required = [ 'username', 'password' ]
    ,   setCookie
    ,   elements = [];

    for ( var i = 0; i < required.length; i++ ) {
        if ( typeof creds[ required[ i ] ] == 'undefined' ) {
            return _this.emit( 'loginFailure', 'Missing required fields.' );
        }
    }

    // Check for user existence
    User.verifyCredentials( creds.username, creds.password, function( err, user ) {

        // Error
        if ( err || ! user ) return _this.emit( 'loginFailure', 'Unexistent user.' );

        // Set cookie
        if ( _this.setAuthCookie( user ) ) {
            return _this.emit( 'loginSuccess', user );
        }

        else return _this.emit( 'loginFailure', 'Could not set auth cookie.' );

    });

}


 /**
 * Sets the authentications cookie
 */
Entrance.prototype.setAuthCookie = function( user ) {

    var pFrag
    ,   cookie
    ,   key;

    if ( typeof user.username == 'undefined' || typeof user.password == 'undefined' ) {
        return false;
    }

    // Get
    pFrag = user.password.substr( 8, 12 );
    key = utils.hash( user.username + '|' + pFrag + '|' + this.config.expiration.getTime() );

    // Cookie
    cookie = user.username + '|' + this.config.expiration.getTime() + '|' + key;

    // Set the cookie
    this.res.cookie( this.config.cookieName, cookie, { maxAge: 9000000000 } );
    return true;
 }


















/**
* App debug
*/
exports.app = function( req, res ) {

    var user = {
            _id: none
        ,   display_name: 'Pablo Vallejo'
        ,   username: 'pablo'
    }

    res.render( 'app', { user: user } );
}

/**
* Index View
*/
exports.index = function( req, res ) {

    var entrance = new Entrance( req, res );

    // Logged in
    entrance.on( 'loggedIn', function( a, b ) {
        console.log( a );
        res.render( 'app' );
    });

    // Not logged in
    entrance.on( 'notLoggedIn', function( a, b ) {
        console.log( a );
        res.render( 'index' );
    });

    // Valida user
    entrance.validateAuthCookie();

    // var Foo = function( a ) { console.log( a ); }
    // Foo.prototype = new events.EventEmitter;

    // // Method
    // Foo.prototype.increment = function() {
    //     console.log( 'increament' );
    //     this.emit( 'event' );
    // }

    // var lol = new Foo( 1 );
    // lol
    //     .on( 'event', function( ) { console.log( 'event gotten' ); })
    //     .increment();

    // res.send({ status: 200 });
    // var entrance = new Entrance( req, res )
    // ,   _user;

    // // Route
    // entrance.isUserLoggedIn( function( err, user ) {

    //     _user = user;

    //     if( err ) res.render( 'index' );
    //     console.log( err );

    //     // Get messges
    //     Message.getMessages( 20, function( err, msgs ) {

    //         if ( err ) {
    //             res.render( 'app', { messages: {}, errors: err });
    //         }

    //         res.render( 'app', { messages: {}, user: _user });

    //     });

    // });

}

/**
* App page
*/
exports.app = function( req, res ) {

    // Render app
    res.render( 'app', {} );
}

/**
* Login request
*/
exports.login = function( req, res ) {

    var entrance
    ,   fields = [ 'username', 'password' ]
    ,   data = {};

    for ( var i = 0; i < fields.length; i++ ) {
        data[ fields[ i ] ] = req.param( fields[ i ] );
    }

    // Entrance
    entrance = new Entrance( req, res );

    // Success
    entrance.on( 'loginSuccess', function( user ) {
        console.log( user );
        res.send({ user: user });

    });

    // Failure
    entrance.on( 'loginFailure', function( err ) {
        console.log( err );
        res.send({ error: err });
    });


    // Login
    entrance.login( data );

}


/**
* Creates a user
* Not implemented yet.
*/
exports.createUser = function( req, res ) {

    var user = User
    ,   fields = [ 'username', 'password' ]
    ,   data = {}
    ,   entrance = new Entrance( req, res );

    // Get post data
    for ( var i = 0; i < fields.length; i++ ) {
        data[ fields[ i ] ] = req.param( fields[ i ] );
    };

    // Hash password
    data[ 'password' ] = entrance.hash( data[ 'password' ] );

    // Create model + save user
    candidate = new User( data );
    candidate.save( function( err, user ) {

        if( err ) {
            res.send({ error: 'User could not be created' });
        }

        // Send some user data
        res.send({ user: user });

    });


}

/**
* New message
*/
exports.newMessage = function( req, res ) {

    res.send({ debug:  'gotten' });
    return;

    // Save message
    var data = {}
    ,   errors = []
    ,   fields = [ 'author_id', 'author_display_name'
            , 'message_text', 'date'
        ];

    for ( var i=0; i < fields.length; i++ ) {

        if ( typeof req.param( fields[ i ] ) == 'undefined' ) {
            errors.push( 'Missing ' + fields[ i ] );
            continue;
        }

        // Set data
        data[ fields[ i ] ] = req.param( fields[ i ] );
    }

    // Were there errors?
    if ( errors.length ) {
        res.send({ message: false, errors: errors });
    }

    // Save message
    message = new Message( data );
    message.save( function( err, message ) {

        if ( err ) {
            res.send({ message: false, error: err });
        }

        res.send({ message: message });

    });

}


/**
* Debug
*/
exports.debug = function( req, res ) {

    res.send({ debug: 'Gotten' });

}

// <input type="hidden" name="author-id" value="<%= user._id %>">
// <input type="hidden" name="author-display-name" value="<%= user.display_name %>">
//  <% messages.forEach( function( message ) { %>

//     <div class="message">
//         <div class="avatar">
//             <img class="img-circle" src="images/user-1.jpg" alt="">
//         </div>
//         <div class="message-body">
//             <h4><%= message.author_display_name %><span class="small"> • 10 days ago<span></h4>
//             <p><%= message.message_text %></p>
//         </div>
//     </div>

// <% }) %>