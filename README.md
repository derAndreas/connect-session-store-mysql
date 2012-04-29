# Connect MySQL Session Store

Simple MySQL Session Store for [Connect() Framework][1] session Middleware


## Installation

Use `git clone` to download the source and make it available in your project wirh `npm link`.

## Usage

This session store is build to work with [Connect() Framework][1] / [ExpressJS() Framework][2] / [RailwayJS() Framework][3]
Use it like any other middleware.

### Abstract example

The lib handles it own client, so pass in the credentials and options if needed.

    var MySQLStore = new MySQLStore(`credentials`, `options`);


### Connect() / ExpressJS() Example

    var express    = require('express'),
        MySQLStore = require('connect-session-store-mysql')(express);

    var app = express.createServer();
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'mySecretKey', store: new MySQLStore({
        host     : "<hostname>",        // can be ommited, default to 127.0.0.1
        user     : "<username>",
        password : "<password>",
        database : "<databasename>",
        debug    : "<mysql-debug-flag>" // can be ommited, default to false
    })));


### RailwayJS Example

Configuration is done in config/environment.js file.

    var express    = require('express'),
        MySQLStore = require('connect-session-store-mysql')(express),
        config     = require('./database.json');

    app.configure(
        var cwd = process.cwd();
        app.use(express.static(cwd + '/public', {maxAge: 86400000}));
        // more app.use()...
        app.use(express.cookieParser('secret'));

        app.use(express.session({
            secret: 'secret',
            store : new MySQLStore(config[app.set('env')])
        }));
    );


## Options

This lib allows you to modify many things, as all is encapsulated, 
and pass it while createing the store. To use the options :

    new MySQLStore(credentials, {
        // place options here
    });

The following options are available

### expire

Expiration in `SECONDS`, default 3600 seconds


### tableName

The MySQL Tablename to use in the database provided by crendtials.
If this options is not used, it will create a table called `session_store`


### colSid

The column name in the session store table for the sid. Default to `sid`.

### colData

The column name in the session store table for the session data. Default to `data`.

### colExpire

The column name in the session store table for the expiraton value. Default to `expire`.



## The MSQL Schema

The MySQL Table schema must contain 3 columns, based on the defaults or your custom configuration.

    Column  |  Type
    -----------------
    sid     |  VARCHAR
    data    |  TEXT
    expire  |  DATETIME


### Example to create with default column name

    CREATE TABLE IF NOT EXISTS `session_store` (
      `sid` varchar(255) NOT NULL,
      `data` text NOT NULL,
      `expire` datetime NOT NULL,
      PRIMARY KEY (`sid`)
    ) ENGINE=MyISAM DEFAULT CHARSET=latin1;


## Changes

20120419: initial release

## Todo

- option to migrate db schema
- option to clean existing db table for testing environment
- test scripts

## Other Implementations

There are some other implementations, that are maybe more stable and tested.

 - [connect-mysql][4] by nathan-lafreniere, License: MIT
 - [connect-mysql-session][5] by CarnegieLearning , License: own

Both did not get my needs.
connect-mysql need to create and pass in a mysqlclient instance.
connect-mysql-session uses sequelize, which is a bit too much 
overhead for 3 columns and 4 sql statements


## LICENSE
MIT


[1]: https://github.com/senchalabs/connect
[2]: https://github.com/visionmedia/express
[3]: http://railwayjs.com/
[4]: https://github.com/nathan-lafreniere/connect-mysql
[5]: https://github.com/CarnegieLearning/connect-mysql-session
