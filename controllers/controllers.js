// this will store the messages and act as a fake db .-)
var fakeDb = {
    messages : []
};



var BallController = (function(){
    
    
    
    var ballController = function(client){
        this.alias ="ball";
        this.client = client; 
        this.color = "#ff0000";
        this.arena = "default";
        this.id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
        this.x = 100;
        this.y = 100;
        
    };
    
    ballController.prototype.move = function(data,controller,topic){
      this.invokeToAll({x:data.x,y:data.y,c:this.color, a:this.arena,id: this.id
            
        },"move",this.alias);
    };
    
    ballController.prototype.getBall = function(data,controller,topic){
           this.invoke({x:this.x,y:this.y,c:this.color, a:this.arena,id: this.id
        },"ballCreated",this.alias);
    };
    return ballController;
})();


exports.BallController = BallController;

var SimpleChatController = (function () {
    var simpleChat = function (client) {
        this.alias = "simplechat"; // mandatory member
        this.client = client; // mandatory member
        this.age = 11;
    }

    // optional memmber
    simpleChat.prototype.onclose = function (timestamp) {
        this.invoke({ message: "onclose fired on simplechat", created: timestamp.toString(), age: this.age }, "say", this.alias);
    },
    // optional member
    simpleChat.prototype.onopen = function (timestamp) {
        this.invoke({ message: "onopen fired on simplechat", created: timestamp.toString(), age: this.age }, "say", this.alias);
    },
    // send a message to all clients connected to foo
    simpleChat.prototype.sayToAll = function (data, controller, topic) {
        this.invokeToAll({ message: data.message, created: data.created, age: this.age }, "say", this.alias);
    };
    // send a message to callee  
    simpleChat.prototype.say = function (data, controller, topic) {
        this.invoke({ message: data.message, created: data.created, age: this.age }, "say", this.alias);
    };
    // send to all clients with an .age greater or equal to 10
    simpleChat.prototype.sayTo = function (data, controller, topic) {
        var _this = this;
        var expression = function (pre) {
            return pre[_this.alias].age >= 10;
        };
        this.invokeTo(expression,
            { message: data.message, created: data.created, age: this.age }, "say", this.alias);

    };
    return simpleChat;
})();

exports.SimpleChatController = SimpleChatController;


var ChatController = (function (db) {
    // find out who this message targets?
    var directMessage = function (message) {
        var result = message.match(/@\w+/g);
        return result;
    };
    // ctor function
    var chatController = function (client) {
        this.alias = "chat";
        this.client = client;
        this.nickname =  Math.random().toString(36).substr(2, 5); // set a random nickname
    };
    
    // when a clients connect, send back the random created nick name
    chatController.prototype.onopen = function () {
        this.invoke({
            t: "You are known as '" + this.nickname + "' to others...",
             n: this.nickname
        }, "nickname", this.alias)

    };
    // change the nick name for the current user/connection
    chatController.prototype.setNickname = function (message) {
        this.invokeToAll({
            t: "'" + this.nickname +"' is now known as " +message.nickname
        }, "chatmessage", this.alias)
        this.nickname = message.nickname;

    };
    // get's the history
    chatController.prototype.getHistory = function () {
        this.invoke(db.messages,
        "history", this.alias);
    };

    /// send a chat message
    chatController.prototype.sendMessage = function (message) {
        var self = this;
        var messageTo = directMessage(message.t); // find if it tagets someone?
        // add the "senders" nickname to message
        message.n = this.nickname;
        if (!messageTo) { // this message is for "all" 

            this.invokeToAll(message,
            "chatmessage", this.alias);
            db.messages.push(message); // store the message as it's pubic..

        } else {
            // find he user(s) and target them individualy 
            message.p = true; // flag the message as private
            messageTo.forEach(function (nickname) {
                var expression = function (pre) {
                    return pre["chat"].nickname === nickname.replace("@","");
                };
                self.invokeTo(expression, message, "chatmessage", self.alias);
            });
            // send the private message back to calle as well..
              this.invoke(message,
                  "chatmessage", this.alias);
        }
    };
    return chatController;
})(fakeDb /* pass a fare database :-) */);

exports.ChatController = ChatController;