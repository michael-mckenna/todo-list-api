var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore'); //refactors logic so we don't have to do any looping
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

var todoNextId = 1;
var todos = [];

/*debugger; used for debugging as a breakpoint
  - must call node debug server.js
  - call cont to continue in terminal
 */
app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos?completed:true&q=work
app.get('/todos', function(req, res) {
    var queryParams = req.query;
    var filteredTodos = todos;

    if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
        filteredTodos = _.where(todos, {completed: true});
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
        filteredTodos = _.where(todos, {completed: false});
    }

    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        filteredTodos = _.filter(filteredTodos, function (todo) {
            return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) >= 0;
        });
    }

    res.json(filteredTodos);
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

    if (matchedTodo) {
        res.json(matchedTodo);
    } else {
        res.status(404).send();
    }

    res.send('Asking for todo with id of ' + req.params.id);
});

// POST /todos
app.post('/todos', function (req, res) {
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
        res.json(todo.toJSON());
    }, function (e) {
        res.status(400).json(e);
    });
});

// DELETE /todos/:id
app.delete('/todos/:id', function (req, res) {
    var id = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: id});

    if (!matchedTodo) {
        res.status(404).json({"error": "no todo found with that id"});
    } else {
        todos = _.without(todos, matchedTodo);
        res.json(matchedTodo);
    }
});

// PUT /todos/:id
app.put('/todos/:id', function (req, res) {
    var id = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: id});
    var validAttributes = {};
    var body = req.body;

    if (!matchedTodo) {
        res.status(404).json({"error": "no todo found with that id"});
    }

    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed;
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }

    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validAttributes.description = body.description;
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    }

    _.extend(matchedTodo, body);
    res.json(matchedTodo);
});

db.sequelize.sync().then(function () {
    app.listen(PORT, function() {
        console.log('Listening on ' + PORT);
    });
});
