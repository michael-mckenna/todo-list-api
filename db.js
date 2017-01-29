var Sequelize = require('sequelize');
//env variables are variables set depending on where nodes run and various configurations
//using postgres on production and sqlite on development
var env = process.env.NODE_ENV || 'development'
var sequelize;

if (env === 'production') {
    //connection string
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres'
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        'dialect': 'sqlite',
        'storage': __dirname + '/data/dev-todo-api.sqlite'
    });
}
var db = {};

db.todo = sequelize.import(__dirname + "/models/todo.js");
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
