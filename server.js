var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore'); //refactors logic so we don't have to do any looping
var db = require('./db.js');
var bcrypt = require('bcrypt');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

/*debugger; used for debugging as a breakpoint
  - must call node debug server.js
  - call cont to continue in terminal
 */
app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos?completed:true&q=work
app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var query = req.query;
    var where = {
        userId: req.user.get('id')
    };

    if (query.hasOwnProperty('completed') && query.completed === 'true') {
        // filteredTodos = _.where(todos, {completed: true});
        where.completed = true;
    } else if (query.hasOwnProperty('completed') && query.completed === 'false') {
        // filteredTodos = _.where(todos, {completed: false});
        where.completed = false;
    }

    if (query.hasOwnProperty('q') && query.q.length > 0) {
        // filteredTodos = _.filter(filteredTodos, function (todo) {
        //     return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) >= 0;
        // });
        where.description = {
            $like: '%' + query.q + '%'
        };
    }

    db.todo.findAll({where: where}).then(function (todos) {
        res.json(todos);
    }, function (e) {
        res.status(500).send();
    });
});

// GET /todos/:id
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var todoId = parseInt(req.params.id, 10);

    db.todo.findOne({
        where : {
            id: todoId,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (!!todo) { //an empty object is truthy, nil is falsy
            res.json(todo.toJSON());
        } else {
            res.status(404).send();
        }
    }, function (e) {
        res.status(500).send();
    });
    //
    // var matchedTodo = _.findWhere(todos, {id: todoId});
    //
    // if (matchedTodo) {
    //     res.json(matchedTodo);
    // } else {
    //     res.status(404).send();
    // }
    //
    // res.send('Asking for todo with id of ' + req.params.id);
});

// POST /todos
app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = req.body;
    //
    // //completed must be bool, description must be string
    // if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
    //   return res.status(400).send();
    // }
    //
    // body.id = todoNextId++;
    // todos.push(body);
    //
    // console.log('description ' + body.description);
    //
    // res.json(body);
    db.todo.create(body).then(function (todo) {
        //res.json(todo.toJSON());
        req.user.addTodo(todo).then(function () {
            //call reload updates the userId property on the todo object
            //if we leave off reload, a call to the userId property will be null
            return todo.reload();
        }).then(function (todo) {
            res.json(todo.toJSON());
        });
    }, function (e) {
        res.status(400).json(e);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var id = parseInt(req.params.id, 10);
    // var matchedTodo = _.findWhere(todos, {id: id});

    db.todo.destroy({
        where: {
            id: id,
            userId: req.user.get('id')
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted == 0) {
            res.status(404).json({
                error: 'No todo with id'
            })
        } else {
            res.status(204).send();
        }
    }), function () {
        res.status(500).send();
    }
    // if (!matchedTodo) {
    //     res.status(404).json({"error": "no todo found with that id"});
    // } else {
    //     todos = _.without(todos, matchedTodo);
    //     res.json(matchedTodo);
    // }
});

// PUT /todos/:id
app.put('/todos/:id', middleware.requireAuthentication, function (req, res) {
    var id = parseInt(req.params.id, 10);
    // var matchedTodo = _.findWhere(todos, {id: id});
    var attributes = {};
    var body = req.body;

    // if (!matchedTodo) {
    //     res.status(404).json({"error": "no todo found with that id"});
    // }

    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }

    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }

    db.todo.findOne({
        where: {
            id: id,
            userId: req.user.get('id')
        }
    }).then(function (todo) {
        if (todo) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON());
            }, function (e) {
                res.status(400).json(e);
            });
        } else {
            res.status(404).send();
        }
    }, function () {
        res.status(500).send();
    });
    // _.extend(matchedTodo, body);
    // res.json(matchedTodo);
});

app.post('/users', function (req, res) {
    var body = req.body;

    db.user.create(body).then(function (user) {
        res.json(user.toPublicJSON());
    }, function (e) {
        res.status(400).json(e);
    });
})

// POST /users/login (example of custom actions)
app.post('/users/login', function (req, res) {
    var body = req.body;

    db.user.authenticate(body).then(function (user) {
        var token = user.generateToken('authentication');

        if (token) {
            res.header('Auth', token).json(user.toPublicJSON());
        } else {
            res.status(401).send();
        }
    }, function () {
        res.status(401).send();
    });
});

db.sequelize.sync().then(function () {
    app.listen(PORT, function() {
        console.log('Listening on ' + PORT);
    });
});
