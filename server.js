var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore'); //refactors get id and post

var app = express();
var PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

var todoNextId = 1;
var todos = [];

app.get('/', function (req, res) {
    res.send('Todo API Root');
});

// GET /todos
app.get('/todos', function(req, res) {
    res.json(todos);
});

// GET /todos/:id
app.get('/todos/:id', function (req, res) {
    var todoId = parseInt(req.params.id, 10);
    var matchedTodo = _.findWhere(todos, {id: todoId});

    // todos.forEach(function (todo) {
    //     if (todoId === todo.id) {
    //         matchedTodo = todo;
    //     }
    // });

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

    //completed must be bool, description must be string
    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
      return res.status(400).send();
    }

    body.id = todoNextId++;
    todos.push(body);

    console.log('description ' + body.description);

    res.json(body);
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

app.listen(PORT, function() {
    console.log('Listening on ' + PORT);
})
