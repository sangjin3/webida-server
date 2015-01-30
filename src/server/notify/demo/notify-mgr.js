/*
 * Copyright (c) 2012-2015 S-Core Co., Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

var User = function (nick, email, token) {
    this.nick = nick;
    this.email = email;
    this.token = token;
}

var Conn = function (user, host, msgMap) {
    var self = this;
    this.user = user;
    this.msgMap = msgMap;
    //this.sock = io.connect(host, { 'force new connection': true });  
    this.sock = io.connect(host);  
    this.sock.off = this.sock.removeListener;

    this.on = function (name, func) {
        self.sock.off(name);
        self.sock.on(name, func.bind(null, self));
    }

    this.off = function (name) {
        self.sock.off(name);
    }

    function registerMsgMap(arrMap, cli, sock) {
        for (var i=0; i < arrMap.length; i++) {
            sock.on(arrMap[i].name, arrMap[i].func.bind(null, cli));
        }
    }

    if (msgMap) {
        registerMsgMap(msgMap, self, self.sock);
    }

    this.sock.on('connect', function () {
        console.log('connected to the notify-server');
        //updateUserList(self.user.nick);
    });

    this.sock.on('disconnect', function() {
        console.log('disconnected');
    });                                                        

    this.disconnect = function () {
        self.sock.disconnect();
        console.log('try disconnecting...');
    }

    this.sendMsg = function (type, msg) {
        self.sock.emit(type, msg);   
    }
}


var HashMap = function(){  
    this.map = new Array();
};  

HashMap.prototype = {  
    put : function(key, value){  
        this.map[key] = value;
    },  
    get : function(key){  
        return this.map[key];
    },  
    getAll : function(){  
        return this.map;
    },  
    clear : function(){  
        this.map = new Array();
    },  
    getKeys : function(){  
        var keys = new Array();  
        for(i in this.map){  
            keys.push(i);
        }  
        return keys;
    }
};


var notifyMgr = (function() {
    function msg_Ready(conn, msg) {
        updateLog('ready - ' + JSON.stringify(msg));
        conn.sendMsg('auth', conn.user);   
    }

    function msg_authAns(conn, msg) {
        updateLog('authAns - ' + JSON.stringify(msg));
        var subInfo = { 'topic': 'group_1111' }; 
        conn.sendMsg('sub', subInfo);
    }

    function msg_subAns(conn, msg) {
        updateLog('subAns - ' + JSON.stringify(msg));
        //var info = { 'id': 'group_1111', 'msg': 'test is the notification message' }; 
        //conn.sendMsg('pub', info);
    }

    function msg_pubAns(conn, msg) {
        updateLog('pubAns - ' + JSON.stringify(msg));
    }

    function msg_userNtf(conn, msg) {
        console.log('-----------' + JSON.stringify(msg));
        if (msg.data.type === 'msg') {
            updateTalkShow(msg);
        } else if (msg.data.type === 'join') {
            joinUser(msg.from.nick);
        }
        else if (msg.data.type === 'userlist') {
            var userList = msg.data.userlist;
            for (var i in userList) {
                var userInfo = userList[i];
                joinUser(userInfo.user.nick);
            }
        }
        updateLog('user ntf - - ' + JSON.stringify(msg));
    }

    function msg_sysNtf(conn, msg) {
        updateSysNoti(msg);
        updateLog('system ntf - - ' + JSON.stringify(msg));
    }

    var msgMap = [
        { name: 'ready', func: msg_Ready },
        { name: 'authAns', func: msg_authAns },
        { name: 'subAns', func: msg_subAns },
        { name: 'pubAns', func: msg_pubAns },
        { name: 'userNtf', func: msg_userNtf },
        { name: 'sysNtf', func: msg_sysNtf }
    ];

    var connMap = new HashMap();
    var init = function (user, host) {
        console.log(JSON.stringify(user));
        var conn = new Conn(user, host, msgMap);    
        connMap.put(user.nick, conn);
    };

    var sub = function (user, info) {
        var conn = connMap.get(user.nick);    
        conn.sendMsg('sub', info);    
    }

    var pub = function (user, info) {
        var conn = connMap.get(user.nick);    
        conn.sendMsg('pub', info);    
    }

    return {
        init: init,
        sub: sub,
        pub: pub
    };

})();

