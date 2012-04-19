
var mysql = require('mysql');


module.exports = function(connect) {

    var Store = connect.session.Store;

    function MySQLStore(credentials, options) {
        options = options || {};
        Store.call(this, options);
        
        this.client = mysql.createClient({
            host     : credentials.host || credentials.hostname || '127.0.0.1',
            user     : credentials.user || credentials.username,
            password : credentials.pass || credentials.password,
            database : credentials.database || credentials.db,
            debug    : credentials.debug || false
        });

        this.expire = options.expire || 3600;
        
        this.tableName = options.tableName || 'session_store';
        this.colSid    = (options.col && options.col.sid)    || 'sid';
        this.colData   = (options.col && options.col.data)   || 'data';
        this.colExpire = (options.col && options.col.expire) || 'expire';

        this.sql =  {
            select : function(sid) {
                return 'SELECT ' + escape(this.tableName, this.colSid) + ', '
                                 + escape(this.tableName, this.colData) + ', '
                                 + escape(this.tableName, this.colExpire)
                     + ' FROM '  + escape(this.tableName)
                     + ' WHERE ' + escape(this.tableName, this.colSid) + ' = "' + sid + '" LIMIT 1';
            }.bind(this),
            insert: function(sid, data, expire) {
                return "INSERT INTO " + escape(this.tableName) + " ("
                                      + escape(this.tableName, this.colSid) + ", "
                                      + escape(this.tableName, this.colData) + ", "
                                      + escape(this.tableName, this.colExpire) + ") "
                       + "VALUES ('" + sid + "', '" + data + "', '" + expire + "')";
            }.bind(this),
            update: function(sid, data, expire) {
                return "UPDATE " + escape(this.tableName)
                       + " SET "
                        + escape(this.tableName, this.colData)   + " = '" + data   + "', "
                        + escape(this.tableName, this.colExpire) + " = '" + expire + "' "
                       + "WHERE "
                        + escape(this.tableName, this.colSid)    + " = '" + sid + "'";
            }.bind(this),
            destroy: function(sid) {
                return 'DELETE FROM '
                        + escape(this.tableName)
                       + ' WHERE '
                        + escape(this.tableName, this.colSid) + ' = "' + sid + '"';
            }.bind(this),
            garbage: function() {
                return 'DELETE FROM '
                        + escape(this.tableName)
                      + ' WHERE '
                        + escape(this.tableName, this.colExpire) + ' < "' + dateToMysql(new Date()) + '"';
            }.bind(this)
        }

        if(options.garbageCollect !== false) {
            var interval = typeof options.garbageCollect === 'number' ? options.garbageCollect : 60*10*1000; // 10 minutes
            setInterval(function() {
                this.client.query(this.sql.garbage());
            }.bind(this), interval)
        }
    };

    // from jugglingdb, license MIT, https://github.com/1602/jugglingdb
    function dateToMysql(val) {
        return val.getUTCFullYear() + '-' +
            fillZeros(val.getUTCMonth() + 1) + '-' +
            fillZeros(val.getUTCDate()) + ' ' +
            fillZeros(val.getUTCHours()) + ':' +
            fillZeros(val.getUTCMinutes()) + ':' +
            fillZeros(val.getUTCSeconds());

        function fillZeros(v) {
            return v < 10 ? '0' + v : v;
        }
    };

    function escape(table, val) {
        return '`' + table + '`' + (val ? '.`' + val + '`' : '');
    }

    MySQLStore.prototype.__proto__ = Store.prototype;

    MySQLStore.prototype.get = function(sid, callback) {
        this.client.query(this.sql.select(sid), function(err, result) {
            try {
                if(!result || result.length == 0) {
                    return callback();
                }
                var data = result[0][this.colData].toString();
                // todo transform the expire to JS Date
                // val = new Date(val.toString().replace(/GMT.*$/, 'GMT'));
                callback(null, JSON.parse(data));

            } catch(err) {
                callback(err);
            }
        }.bind(this));
    };

    MySQLStore.prototype.set = function(sid, sess, callback) {
        var expire = dateToMysql(sess.cookie.expires || new Date(Date.now() + this.expire * 1000)),
            sql;
        
        try {
            sess = JSON.stringify(sess);
            this.client.query(this.sql.select(sid), function(err, result) {
                if(result && result[0]) {
                    sql = this.sql.update(sid, sess, expire);
                } else {
                    sql = this.sql.insert(sid, sess, expire);
                }
                this.client.query(sql, function(err, result) {
                    callback(err, result);
                });
            }.bind(this));

        } catch(err) {
            callback && callback(err);
        }
    };

    MySQLStore.prototype.destroy = function(sid, callback) {
        this.client.query(this.sql.destroy(sid), callback)
    };

    return MySQLStore;
};
